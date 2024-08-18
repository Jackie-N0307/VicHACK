import './player.css';
import logo from './assets/logo_only.png';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';


function PlayerScreen() {
  const [videoURL, setVideoURL] = useState(null);
  const [redCount, setRedCount] = useState(0)
  const [blueCount, setBlueCount] = useState(0)
  const [redStamp, setRedStamp] = useState([])
  const [blueStamp, setBlueStamp] = useState([])
  const [redLog, setRedLog] = useState([]);
  const [blueLog, setBlueLog] = useState([]);
  const videoRef = useRef(null);
  let bi = 0
  let ri = 0


  // Function to handle video upload and fetching video URL
  const handleUpload = async () => {

      try {
        const response = await axios.get("http://127.0.0.1:8080/serve"); 
        setVideoURL(response.request.responseURL); // Use the URL from the response
        }
      catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    const fetchTimestamps = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8080/timeframe");
        setRedStamp(response.data.red_timestamps);
        setBlueStamp(response.data.blue_timestamps); 
        

      } catch (error) {
        console.error('Error fetching timestamps:', error);
      }
    };

    const updateCounters = () => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const formattedTime = secondsToMMSS(currentTime);

        if (formattedTime === redStamp[ri]) {
          setRedLog(prevLog => [...prevLog, formattedTime]);
          ri++
        }

        if (formattedTime === blueStamp[bi]) {
          setBlueLog(prevLog => [...prevLog, formattedTime]);
          bi++
        }


        const redHits = redStamp.filter(timestamp => timestamp <= formattedTime).length;
        const blueHits = blueStamp.filter(timestamp => timestamp <= formattedTime).length;
        
        setRedCount(redHits);
        setBlueCount(blueHits);

        
      }


    };
    
    const secondsToMMSS = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

  useEffect(() => {
    handleUpload()
    fetchTimestamps()

  }, []);

  useEffect(() => {
    const interval = setInterval(updateCounters, 500);
    return () => clearInterval(interval); // Clean up interval on unmount
  }, [videoURL, redStamp, blueStamp]);
  
  
  


  return (
    <>
      <div className='heading-div'>
        <img src={logo} className='logo' alt="Logo" />
        <h1 className='accu-title'>AccuBoxer AI</h1>
      </div>
      
      <div className='boxing-display'>
        <div className='player-container'>
          <div className='redboxer-div'>
            <h1 className='boxer-title'>Red Boxer</h1>
            <p className='landed-red'>Head Punches Landed</p>
            <p className='red-punch-counter'>{redCount}</p>
            <h2 className='logbook-title'>Punch Timestamps</h2>
            <div className='red-logbook'>
                <ul className='logbook-list'>
                  {redLog.map((time, index) => (
                    <li key={index}>{time}</li>
                  ))}
                </ul>
            </div>
          </div>
          

          <div className='player-div'>
          
            <video ref={videoRef} autoPlay height='80%' width='100%'>
              <source src={"http://127.0.0.1:8080/serve"} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

          
            <div className='button-div'>
              <Link to={'/'} className='back-link'>
                <button className='back-button'>Try Another Video</button>
              </Link>
            </div>
          
            
          </div>
          
          <div className='blueboxer-div'>
            <h1 className='boxer-title'>Blue Boxer</h1>
            <p className='landed-blue'>Head Punches Landed</p>
            <p className='blue-punch-counter'>{blueCount}</p>


            <h2 className='logbook-title'>Punch Timestamps</h2>
            <div className='blue-logbook'>
              <ul className='logbook-list'>
                {blueLog.map((time, index) => (
                  <li key={index}>{time}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PlayerScreen;
