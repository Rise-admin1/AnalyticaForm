import React, { useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import { backendUrl } from '../utils/backendUrl';
import { axiosWithAuth } from '../utils/customAxios';
import { refreshToken } from '../utils/refreshToken';
import { useNavigate } from 'react-router-dom';
import TemporaryDrawer from '../components/TempDrawer';
import SelectOneChoiceForm from '../components/SelectOneChoiceForm';
import SelectMultiPoint from '../components/SelectMultiPoint';
import { Stack } from '@mui/material';
import { uid } from 'uid';

const CreateNewSurvey = () => {

  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [surveyData, setSurveyData] = useState({
    surveyTitle: '',
    surveyForms: [],
    selectedItems: []
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // drawer open close
  const [selectedItems, setSelectedItems] = useState([]); // selected items 

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleItemSelect = (item) => {
    setSelectedItems([...selectedItems, item]);
    setSurveyData({...surveyData, surveyForms:[...surveyData.surveyForms, {id:uid(5),formType:item}]}) 
  };

  const handleFormChange = (e) => {
    setSurveyData({
      ...surveyData,
      [e.target.name]: e.target.value,
    });
  }
  const handleSaveSelectOneForm = (formData) => {
    console.log(formData, 'formData in the parent');
    
    // Check if the formData id exists in the surveyForms array
    const existingFormIndex = surveyData.surveyForms.findIndex(form => form.id === formData.id);
    
    if (existingFormIndex !== -1) {
      // If the form data already exists, update it
      setSurveyData(prevSurveyData => ({
        ...prevSurveyData,
        surveyForms: prevSurveyData.surveyForms.map((form, index) => {
          if (index === existingFormIndex) {
            return formData; // Update existing form data
          }
          return form; // Leave other form data unchanged
        })
      }));
    } else {
      // If the form data doesn't exist, add it to the surveyForms array
      setSurveyData(prevSurveyData => ({
        ...prevSurveyData,
        surveyForms: [...prevSurveyData.surveyForms, formData]
      }));
    }
  };

  const handleDeleteSelectOneForm = (id) => {
    console.log(id,'id in delete');
    const newSurveyForms = surveyData.surveyForms.filter(form =>{ 
      console.log(form.id,'form.id in delete filter');
      return form.id !== id});
    console.log(newSurveyForms,'newSurveyForms in delete form filter');
    setSurveyData({...surveyData,surveyForms:newSurveyForms});

  }

  const handleSaveSelectMultiPointForm = (formData) => {
    
    const existingFormIndex = surveyData.surveyForms.findIndex(form => form.id === formData.id);
    
    if (existingFormIndex !== -1) {
      // If the form data already exists, update it
      setSurveyData(prevSurveyData => ({
        ...prevSurveyData,
        surveyForms: prevSurveyData.surveyForms.map((form, index) => {
          if (index === existingFormIndex) {
            return formData; // Update existing form data
          }
          return form; // Leave other form data unchanged
        })
      }));
    } else {
      // If the form data doesn't exist, add it to the surveyForms array
      setSurveyData(prevSurveyData => ({
        ...prevSurveyData,
        surveyForms: [...prevSurveyData.surveyForms, formData]
      }));
    }

  }

  const handleSubmitForm = async () => {
    try {
      await refreshToken();
      const updateSurveyData = await axiosWithAuth.put(`${backendUrl}/api/survey/get-one-survey/${surveyId}`, surveyData);
      navigate('/dashboard');
    }
    catch (err) {
      if (err.response.status === 401) {
        console.log('unauthorized');
        localStorage.removeItem('userAccessToken');
        navigate('/login');
      }
      else {
        console.log(err);

      }
    }

  }

  useEffect(() => {

    const getSurveyData = async () => {
      try {
        await refreshToken();
        const getUserSurveyData = await axiosWithAuth.get(`${backendUrl}/api/survey/get-one-survey/${surveyId}`);
        setSurveyData({

          surveyTitle: getUserSurveyData.data.surveyTitle,
          surveyForms: getUserSurveyData.data.surveyForms,
          selectedItems: getUserSurveyData.data.selectedItems

        });
        setSelectedItems(getUserSurveyData.data.selectedItems)

      }
      catch (err) {
        if (err.response.status === 401) {
          console.log('unauthorized');
          localStorage.removeItem('userAccessToken');
          navigate('/login');
        }
        else {
          console.log(err);

        }
      }
    }
    getSurveyData();
  }, []);

  const selectItem = surveyData.surveyForms.map((item,index) => {
    console.log(item, 'item in selectItem mapppppppp');
    if (item.formType === 'SingleForm') {

      return (
        <Stack spacing={2} key={index} direction='row'>
      <SelectOneChoiceForm key={index} onSaveForm={handleSaveSelectOneForm} data={item} id={item.id} options={item.options}  />
      <button onClick={()=>handleDeleteSelectOneForm(item.id)}>Delete Form</button>
      </Stack>
    )
    }
    else if (item.formType === 'MultiForm') {
      return <SelectMultiPoint key={index} onSaveForm={handleSaveSelectMultiPointForm} data={item} id={item.id} options={item.options}  />
    }

  });

  console.log(surveyData, 'surveyData in the parent');
  console.log(surveyData.surveyForms, 'surveyFormsssss in surveyData in the parent');
  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{
          bgcolor: 'brown',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexGrow: 1,
          height: '100%',
          mt: { xs: 4, md: 8 },
          width: '100%',
          boxShadow: 3,
          borderRadius: 1,
          p: 2,
        }} >

          <TextField fullWidth id="standard-basic" label="Standard" variant="standard" name='surveyTitle' value={surveyData.surveyTitle} onChange={handleFormChange} />
          <Stack spacing={12}>
            {selectItem}
          <Button variant="contained" color="primary" onClick={toggleDrawer}>
            Add Form
          </Button>
          </Stack>
        </Box>
        <Button variant="contained" color="primary" onClick={handleSubmitForm}>
            Submit
          </Button>
      </Container>
      
      <TemporaryDrawer open={isDrawerOpen} toggleDrawer={toggleDrawer} handleItemSelect={handleItemSelect} />

    </React.Fragment>

  )
}

export default CreateNewSurvey