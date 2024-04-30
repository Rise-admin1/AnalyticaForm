import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import { Stack } from '@mui/material';
import Radio from '@mui/material/Radio';





const SelectOneChoiceForm = () => {
  const [selectedValue, setSelectedValue] = React.useState('a');
  const formData = {
    question: '',
    options: [],
    selectedValue: ''
  }

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{
          bgcolor: 'orange',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexGrow: 1,
          height: "100%",
          mt: { xs: 4, md: 8 },
          width: '100%',
          boxShadow: 3,
          borderRadius: 1,
          p: 2,
        }} >
          <TextField fullWidth id="standard-basic" label="Standard" variant="standard" name='' value='' />

          <Stack spacing={2}>
            
            <Stack spacing={2} direction={'row'}>
              <Radio
                checked={selectedValue === 'a'}
                onChange={handleChange}
                value="a"
                name="radio-buttons"
                inputProps={{ 'aria-label': 'A' }}
              />
              <TextField id="standard-basic" label="Standard" variant="standard" name='' value='' />
            </Stack>
          </Stack>
        </Box>
      </Container>
    </React.Fragment>

  )
}

export default SelectOneChoiceForm