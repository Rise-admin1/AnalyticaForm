import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { corsOptions } from './utils/corsFe.js';
import authRoute from './routes/auth-route.js';
import surveyRoute from './routes/survey-route.js';
import userResponseSurveyRoute from './routes/user-response-survey.route.js';
import excelRoute from './routes/excel-route.js';
import stripeRoute from './routes/stripe-route.js';
import { stripeDriWebhook, stripeWebhook } from './controllers/stripe-controller.js';
import superAdminData from './routes/superadmin-data-route.js';
import awsS3Route from './routes/awsS3-route.js';
import vertexGoogleApi from './routes/open-ai-route.js';
import sendEmailRoute from './routes/sendEmail-route.js';
import sendSurveyCountRoute from './routes/survey-count-route.js';
import driPdfRoute from './routes/dri-pdf-route.js';
import mtcRoute from './routes/mtcm-route.js';
import zoomRoute from './routes/zoom-route.js';
import surveyInviteRoute from './routes/survey-invite.route.js';
import aiSurveyRoute from './routes/ai-survey.route.js';
import adminRoute from './routes/admin-route.js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { htmlMessage,healthCheckMessage } from './utils/static/static-data.js';
import { dynamicMetaHtml } from './controllers/dynamic-html-preview-controller.js';
import cron from 'node-cron';
import { runDefenceReadinessResponseEmails } from './jobs/defenceReadinessResponseEmails.js';
import { runExpireZoomMeetings } from './jobs/expireZoomMeetings.js';
import { runSurveyInviteSends, runSurveyInviteReminders } from './jobs/surveyInviteJobs.js';
import chalk from 'chalk';
import compression from 'compression';
import helmet from 'helmet';

dotenv.config();


const app = express();

// app.set('trust proxy', true);
app.use(compression({
  filter: (req, res) => {
    if (req.originalUrl?.startsWith('/api/google-vertex/chat')) return false;
    return compression.filter(req, res);
  },
}));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));

// Register webhook route BEFORE body parsers to preserve raw body for signature verification
app.post('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }), stripeWebhook);
app.post('/api/stripe/dri/webhook', bodyParser.raw({ type: 'application/json' }), stripeDriWebhook);

app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send(htmlMessage);
});

app.use('/api/auth', authRoute)
app.use('/api/survey', surveyRoute)
app.use('/api/user-response-survey', userResponseSurveyRoute)
app.use('/api/stripe', stripeRoute)
app.use('/api/excel', excelRoute)
app.use('/api/superadmin-data', superAdminData)
app.use('/api/s3', awsS3Route)
app.use('/api/send-email', sendEmailRoute)
app.use('/api/survey-count', sendSurveyCountRoute)
app.use('/api/google-vertex', vertexGoogleApi)
app.use('/api/dri', driPdfRoute)
app.use('/api/mtcm', mtcRoute)
app.use('/api/zoom', zoomRoute)
app.use('/api/survey-invites', surveyInviteRoute)
app.use('/api/ai-survey', aiSurveyRoute)
app.use('/api/admin', adminRoute)
app.get('/survey-meta/:surveyId', dynamicMetaHtml)


app.get('/health', (req, res) => {
  res.status(200).json(healthCheckMessage);
  console.log('Health check passed');
});



app.use(errorHandler);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running at port ${PORT}`);
  // cron.schedule('*/1 * * * *', () => {
  //   runDefenceReadinessResponseEmails().catch((err) =>
  //     console.error('[cron] defenceReadinessResponseEmails:', err?.message || err)
  //   );
  // });
  cron.schedule('*/10 * * * *', () => {
    runExpireZoomMeetings().catch((err) =>
      console.error('[cron] expireZoomMeetings:', err?.message || err)
    );
  });
  cron.schedule('* * * * *', () => {
    runSurveyInviteSends().catch((err) =>
      console.error('[cron] surveyInviteSends:', err?.message || err)
    );
  });
  cron.schedule('*/15 * * * *', () => {
    runSurveyInviteReminders().catch((err) =>
      console.error('[cron] surveyInviteReminders:', err?.message || err)
    );
  });
  console.log(chalk.blue.bgRed.bold('Cron: Defence readiness response emails every 1 minute'));
  console.log(chalk.blue.bgRed.bold('Cron: Expire Zoom meetings every 10 minutes'));
});