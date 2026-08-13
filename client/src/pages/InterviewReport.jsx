import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api';
import Step3Report from '../components/Step3Report';
function InterviewReport() {
  const {id} = useParams()
  const [report,setReport] = useState(null);
   
  useEffect(()=>{
    const fetchReport = async () => {
      try {
        const result = await api.get("/api/interview/report/" + id)

        setReport(result.data)
      } catch (error) {
        console.log(error)
      }
    }

    fetchReport()
  },[id])

  return <Step3Report report={report}/>
}

export default InterviewReport
