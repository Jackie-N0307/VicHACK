import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './frontscreen.css';
import logo from './assets/logo_only.png';
import { useGlobalState } from './GlobalContext';
import axios from 'axios'
import Lottie from 'lottie-react'
import load from './assets/load.json'
function FrontScreen() {

  const [file, setFile] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const { globalState, setGlobalState } = useGlobalState();
  const [processing, setProcessing] = useState(false);


  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'video/mp4') {
        setFile(selectedFile);
        setShowButton(true);
        setGlobalState(selectedFile);
        
        const formData = new FormData();
        formData.append('file', selectedFile);
  
        try {
          const response = await axios.post("http://127.0.0.1:8080/process", formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          
          });
        } catch (error) {
          console.error('Error uploading file:', error)
        }
        const showMore = () => {
          setProcessing(true)
          setShowButton(false)
        }
        showMore()

  
      } else {
        setFile(null);
        alert('Please upload a valid MP4 file.');
        setShowButton(false);
        setGlobalState(null);
      }
    }
  };
  

  return (
    <>
      <img src={logo} className='front-logo' alt="Logo" />
      <h1 className='login-title'>AccuBoxer AI</h1>
      <div className='upload-container' style={{ display: file ? 'none' : 'block' }}>
        <input
          type="file"
          id="fileInput"
          className="url-input"
          onChange={handleFileChange}
        />
        <label htmlFor="fileInput" className="file-upload-button" style={{ display: file ? 'none' : 'block' }}>
          Choose File
        </label>
      </div>

      <p className='video-success' style={{ display: showButton ? 'block' : 'none' }}>Processing Video...</p>

      <p className='video-success' style={{ display: processing ? 'block' : 'none' }}>
        Video Successfully Uploaded!
      </p>

      <div className='container'>
        <Lottie animationData={load} className='load' style={{ display: showButton ? 'block' : 'none' }}></Lottie>
      </div>
      
      <Link to={'/playerscreen'} className='link'>
        <button
          className='analysis-button'
          style={{ display: processing ? 'block' : 'none' }} >
          Start Analysis
        </button>

      </Link>
    </>
  );
}

export default FrontScreen;
