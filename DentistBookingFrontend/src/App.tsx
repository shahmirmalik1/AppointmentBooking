import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/HomePage";
import BookAppointment from "./pages/BookAppointmentPage";
import ContactUs from "./pages/ContactUsPage";
import Login from "./pages/Login";
import DentistDashboard from "./pages/DentistDashboard";
import AddDoctor from "./pages/AddDoctorPage";
import AddProcedure from "./pages/AddProcedurePage";
import CreateAccount from "./pages/CreateAccountPage";
import AllDoctors from "./pages/AllDoctorsPage";
import AllProcedures from "./pages/AllProceduresPage";
import AllQueriesPage from "./pages/AllQueriesPage";
import PatientHistoryPage from "./pages/PatientHistoryPage";
function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />

        <main className="page-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<BookAppointment />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dentist" element={<DentistDashboard />} />
            <Route path="/add-doctor" element={<AddDoctor />} />
            <Route path="/add-procedure" element={<AddProcedure />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/doctors" element={<AllDoctors />} />
            <Route path="/procedures" element={<AllProcedures />} />
            <Route path="/all-queries" element={<AllQueriesPage />} />
            <Route path="/patient-history" element={<PatientHistoryPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;