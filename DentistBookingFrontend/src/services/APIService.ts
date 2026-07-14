import axios from "axios";

const API_BASE = "http://localhost:5297/api/AppointmentBooking";

export const getContactInfo = async (id: number) => {
  const response = await axios.get(
    `${API_BASE}/GetContactInformation/${id}`
  );

  return response.data;
};

export const GetAllProcedures = async () => {
  const response = await axios.get(
    `${API_BASE}/GetAllProcedures`
  );

  return response.data;
};

export const GetAllDoctors = async () =>{
  const response = await axios.get(    
    `${API_BASE}/GetAllDoctors`
  );
  return response.data;
}

export const CreateDentist = async (payload: any) => {
  const response = await axios.post(`${API_BASE}/CreateDentist`, payload);
  return response.data;
}

export const CreateProcedure = async (payload: any) => {
  const response = await axios.post(`${API_BASE}/CreateProcedure`, payload);
  return response.data;
}

export const LinkDoctorProcedure = async (payload: any) => {
  const response = await axios.post(`${API_BASE}/LinkDoctorProcedure`, payload);
  return response.data;
}

export const GetAllAppointments = async () => {
  const response = await axios.get(`${API_BASE}`);
  return response.data;
}

export const GetAllDoctorsForProcedure = async (procedureId: number) => {
  const response = await axios.get(
    `${API_BASE}/GetAllDoctorsForProcedure/${procedureId}`
  );

  return response.data;
};

export const CreateAQuery = async (query: any) => {
  const response = await axios.post(
    `${API_BASE}/CreateAQuery`,
    query
  );

  return response.data;
};

export const DentistLogin = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE}/DentistLogin`, {
    Email_Address: email,
    Password: password,
  });

  return response.data;
};

export const GetDoctorQueries = async (doctorId: number) => {
  const response = await axios.get(`${API_BASE}/GetDoctorQueries/${doctorId}`);

  return response.data;
};

export const GetAllDoctorQueries = async (doctorId: number) => {
  const response = await axios.get(`${API_BASE}/GetDoctorQueries/${doctorId}`, {
    params: { includeResolved: true },
  });

  return response.data;
};

export const GetAllQueries = async () => {
  const response = await axios.get(`${API_BASE}/GetAllQueries`);
  return response.data;
};

export const GetDoctorAppointments = async (doctorId: number) => {
  const response = await axios.get(`${API_BASE}/GetDoctorAppointments/${doctorId}`);
  return response.data;
};

export const GetDentistProfile = async (doctorId: number) => {
  const response = await axios.get(`${API_BASE}/DentistProfile/${doctorId}`);

  return response.data;
};

export const UpdateDentistProfile = async (doctorId: number, payload: any) => {
  const response = await axios.put(`${API_BASE}/DentistProfile/${doctorId}`, payload);

  return response.data;
};

export const ConfirmDoctorQuery = async (queryId: number) => {
  const response = await axios.put(`${API_BASE}/ConfirmDoctorQuery/${queryId}`);
  return response.data;
};

export const RejectDoctorQuery = async (queryId: number) => {
  const response = await axios.put(`${API_BASE}/RejectDoctorQuery/${queryId}`);
  return response.data;
};

export const GetDoctorFreeTimes = async (
  doctorId: number,
  date: string
) => {
  const response = await axios.get(`${API_BASE}/GetDoctorFreeTimes`, {
    params: {
      doctorID: doctorId,
      date,
    },
  });

  return response.data;
};