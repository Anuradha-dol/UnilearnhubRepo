
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import Review from "./review/Review";
import SupportAdmin from "./review/SupportAdmin";
import SupportUser from "./review/SupportUser";
import LandingPage from "./landing/LandingPage";
import Resources from "./library/Resources";
import CreateQuiz from "./library/QuizPage";
import ResourcesManagement from "./library/ResourcesManagement";
import LearningResources from "./library/LearningResources";




import './App.css';

function App() {
  return (
    
    <Router>
      <Routes>
        
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
         <Route path="/verify" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile"element={<Profile/>}/>



              <Route path="/settings"element={<Settings/>}/>

       <Route path="/home" element={<Home/>} />
        <Route path="/dashboard" element={<Dashboard/>} />

 
        <Route path="/resources" element={<Resources />} />
        <Route path="/learning-resources" element={<LearningResources />} />
        <Route path="/resources-management" element={<ResourcesManagement />} />
          <Route path="/createquiz/:videoId" element={<CreateQuiz />} />
       


          <Route path="/Review" element={<Review />} />
          <Route path="/SupportAdmin" element={<SupportAdmin/>} />
          <Route path="/SupportUser" element={<SupportUser/>} />
            <Route path="/" element={<LandingPage/>} />

       

      


      </Routes>
    </Router>
  );
}

export default App;