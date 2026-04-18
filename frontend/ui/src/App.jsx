// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home.jsx";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Resources from "./library/Resources";
import LearningResources from "./library/LearningResources";
import CreateQuiz from "./library/QuizPage";
import ResourcesManagement from "./library/ResourcesManagement";
import Dashboard from "./pages/Dashboard";
import Review from "./review/Review";
import SupportAdmin from "./review/SupportAdmin";
import SupportUser from "./review/SupportUser";
import TaskPage from "./tasks/TaskPage";
import UserAssignedTasksPage from "./tasks/UserAssignedTasksPage";
import AdminTaskManagerPage from "./tasks/AdminTaskManagerPage";

import LandingPage from "./landing/LandingPage";




import './App.css';

function App() {
  return (
    
    <Router>
      <Routes>
        

           <Route path="/" element={<LandingPage/>} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile"element={<Profile/>}/>
             <Route path="/verify" element={<VerifyOtp />} />



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
          <Route path="/taskPage" element={<TaskPage />} />
          <Route path="/assigned-tasks" element={<UserAssignedTasksPage />} />
          <Route path="/admin-task-manager" element={<AdminTaskManagerPage />} />

      


      </Routes>
    </Router>
  );
}

export default App;
