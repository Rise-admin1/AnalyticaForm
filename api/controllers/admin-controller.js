import { prisma } from '../utils/prisma.js';

const parsePaging = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 50, 1), 50);
  return { page, pageSize, skip: (page - 1) * pageSize };
};

const requireSuperAdmin = (req, res) => {
  const isSuper =
    req.tokenSuperAdmin === true ||
    req.tokenSuperAdmin === 'true' ||
    req.tokenSuperAdmin === 1 ||
    req.tokenSuperAdmin === '1';
  if (!isSuper) {
    res.status(403).json({ message: 'Only super admins can access this resource' });
    return false;
  }
  return true;
};

export const getAdminStats = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const nowUnix = Math.floor(Date.now() / 1000);
    const [
      usersJoined,
      guestUsers,
      verifiedUsers,
      proMembers,
      activeSubscriptions,
      surveysTotal,
      surveysPublished,
      surveysDraft,
      surveyResponses,
      marketPurchases,
      marketPurchaseSpend,
      driInterimPaid,
      driFullPaid,
      refundRequests,
      pendingRefunds,
      inviteCampaigns,
      aiSurveyGenerations,
    ] = await Promise.all([
      prisma.user.count({ where: { isGuest: false } }),
      prisma.user.count({ where: { isGuest: true } }),
      prisma.user.count({ where: { emailVerified: true, isGuest: false } }),
      prisma.proMember.count(),
      prisma.proMember.count({
        where: { isSubscribed: true, subscriptionPeriodEnd: { gt: nowUnix } },
      }),
      prisma.survey.count(),
      prisma.survey.count({ where: { surveyStatus: { not: 'Draft' } } }),
      prisma.survey.count({ where: { surveyStatus: 'Draft' } }),
      prisma.userSurveyResponse.count(),
      prisma.responsePurchase.count({ where: { paidStatus: true } }),
      prisma.responsePurchase.aggregate({
        where: { paidStatus: true },
        _sum: { amountPaid: true },
      }),
      prisma.driInterim10SummaryPayment.count({ where: { paidStatus: true } }),
      prisma.driFullReportPayment.count({ where: { paidStatus: true } }),
      prisma.refundRequest.count(),
      prisma.refundRequest.count({ where: { refundStatus: 'pending' } }),
      prisma.surveyInviteCampaign.count(),
      prisma.aiSurveyGeneration.count(),
    ]);

    return res.status(200).json({
      usersJoined,
      guestUsers,
      verifiedUsers,
      proMembers,
      activeSubscriptions,
      surveysTotal,
      surveysPublished,
      surveysDraft,
      surveyResponses,
      marketPurchases,
      marketPurchaseTotalMinor: marketPurchaseSpend._sum.amountPaid || 0,
      driInterimPaid,
      driFullPaid,
      refundRequests,
      pendingRefunds,
      inviteCampaigns,
      aiSurveyGenerations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminUsers = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { page, pageSize, skip } = parsePaging(req);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const where = {
      isGuest: false,
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          isAProMember: true,
          isAdmin: true,
          isSuperAdmin: true,
          createdAt: true,
          _count: { select: { surveys: true, responsePurchases: true } },
          proMember: {
            select: {
              isSubscribed: true,
              subscriptionPeriodEnd: true,
              subscriptionAmmount: true,
            },
          },
        },
      }),
    ]);

    const nowUnix = Math.floor(Date.now() / 1000);
    return res.status(200).json({
      page,
      pageSize,
      total,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: [u.firstName, u.lastName].filter(Boolean).join(' '),
        emailVerified: u.emailVerified,
        isProMember: u.isAProMember,
        isAdmin: u.isAdmin,
        isSuperAdmin: u.isSuperAdmin,
        surveysCount: u._count.surveys,
        purchasesCount: u._count.responsePurchases,
        subscriptionActive: Boolean(
          u.proMember?.isSubscribed && (u.proMember.subscriptionPeriodEnd || 0) > nowUnix
        ),
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminSurveys = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { page, pageSize, skip } = parsePaging(req);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const where = q
      ? {
          OR: [
            { surveyTitle: { contains: q } },
            { user: { email: { contains: q } } },
            { user: { firstName: { contains: q } } },
          ],
        }
      : {};

    const [total, surveys] = await Promise.all([
      prisma.survey.count({ where }),
      prisma.survey.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          surveyTitle: true,
          surveyStatus: true,
          surveyViews: true,
          surveyCompleted: true,
          surveyResponses: true,
          createdAt: true,
          user: { select: { email: true, firstName: true, lastName: true } },
          _count: { select: { responses: true } },
        },
      }),
    ]);

    return res.status(200).json({
      page,
      pageSize,
      total,
      surveys: surveys.map((s) => ({
        id: s.id,
        title: s.surveyTitle,
        status: s.surveyStatus,
        views: s.surveyViews,
        completed: s.surveyCompleted,
        responsesTracked: s.surveyResponses,
        responsesCount: s._count.responses,
        ownerEmail: s.user?.email || null,
        ownerName: s.user ? [s.user.firstName, s.user.lastName].filter(Boolean).join(' ') : null,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminPurchases = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { page, pageSize, skip } = parsePaging(req);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const where = {
      paidStatus: true,
      ...(q
        ? {
            OR: [
              { userEmail: { contains: q } },
              { stripeName: { contains: q } },
              { stripePaymentIntentId: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, purchases] = await Promise.all([
      prisma.responsePurchase.count({ where }),
      prisma.responsePurchase.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userEmail: true,
          responseQuantity: true,
          amountPaid: true,
          amountCurrency: true,
          paidStatus: true,
          stripePaymentIntentId: true,
          stripeRecieptUrl: true,
          stripeName: true,
          stripeCountry: true,
          selectedRegions: true,
          selectedIndustries: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return res.status(200).json({
      page,
      pageSize,
      total,
      purchases: purchases.map((p) => ({
        id: p.id,
        email: p.userEmail,
        name: p.stripeName || [p.user?.firstName, p.user?.lastName].filter(Boolean).join(' ') || null,
        quantity: p.responseQuantity,
        amountPaid: p.amountPaid,
        currency: p.amountCurrency,
        paymentIntentId: p.stripePaymentIntentId,
        receiptUrl: p.stripeRecieptUrl,
        country: p.stripeCountry,
        regions: p.selectedRegions,
        industries: p.selectedIndustries,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminSubscriptions = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { page, pageSize, skip } = parsePaging(req);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const nowUnix = Math.floor(Date.now() / 1000);
    const activeOnly = String(req.query.active || '') === 'true';

    const where = {
      ...(activeOnly ? { isSubscribed: true, subscriptionPeriodEnd: { gt: nowUnix } } : {}),
      ...(q
        ? {
            OR: [
              { subscriptionEmail: { contains: q } },
              { invoiceId: { contains: q } },
              { customerId: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, subscriptions] = await Promise.all([
      prisma.proMember.count({ where }),
      prisma.proMember.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return res.status(200).json({
      page,
      pageSize,
      total,
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        email: s.subscriptionEmail,
        amountMinor: s.subscriptionAmmount,
        periodStart: s.subscriptionPeriodStart,
        periodEnd: s.subscriptionPeriodEnd,
        isSubscribed: s.isSubscribed,
        isActive: Boolean(s.isSubscribed && s.subscriptionPeriodEnd > nowUnix),
        invoiceId: s.invoiceId,
        invoiceUrl: s.hosted_invoice_url,
        userName: s.user ? [s.user.firstName, s.user.lastName].filter(Boolean).join(' ') : null,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminDriPayments = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { page, pageSize, skip } = parsePaging(req);
    const type = typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase() : 'all';

    const [interim, full] = await Promise.all([
      type === 'full'
        ? Promise.resolve([])
        : prisma.driInterim10SummaryPayment.findMany({
            where: { paidStatus: true },
            orderBy: { createdAt: 'desc' },
            include: {
              response: {
                select: {
                  id: true,
                  userEmail: true,
                  userName: true,
                  survey: { select: { surveyTitle: true } },
                },
              },
            },
          }),
      type === 'interim'
        ? Promise.resolve([])
        : prisma.driFullReportPayment.findMany({
            where: { paidStatus: true },
            orderBy: { createdAt: 'desc' },
            include: {
              response: {
                select: {
                  id: true,
                  userEmail: true,
                  userName: true,
                  survey: { select: { surveyTitle: true } },
                },
              },
            },
          }),
    ]);

    const merged = [
      ...interim.map((row) => ({
        id: row.id,
        type: 'interim',
        email: row.emailId || row.response?.userEmail || null,
        respondentName: row.response?.userName || null,
        surveyTitle: row.response?.survey?.surveyTitle || null,
        stripeId: row.stripeId,
        createdAt: row.createdAt,
      })),
      ...full.map((row) => ({
        id: row.id,
        type: 'full',
        email: row.emailId || row.response?.userEmail || null,
        respondentName: row.response?.userName || null,
        surveyTitle: row.response?.survey?.surveyTitle || null,
        stripeId: row.stripeId,
        createdAt: row.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = merged.length;
    const payments = merged.slice(skip, skip + pageSize);
    return res.status(200).json({ page, pageSize, total, payments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
