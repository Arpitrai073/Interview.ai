import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from "axios"
import { ServerUrl } from '../App';
import Step3Report from '../components/Step3Report';
import { getErrorMessage } from '../utils/apiError';
function InterviewReport() {
  const {id} = useParams()
  const navigate = useNavigate()
  const [report,setReport] = useState(null);
  const [error,setError] = useState("");
  const [reloadKey,setReloadKey] = useState(0);

  useEffect(()=>{
    let active = true

    const fetchReport = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/interview/report/" + id , {withCredentials:true})

        if (!active) return
        setError("")
        setReport(result.data)
      } catch (error) {
        console.error("Failed to load interview report:", error)
        if (!active) return
        setError(getErrorMessage(error, "Could not load this report."))
      }
    }

    fetchReport()

    return () => {
      active = false
    }
  },[id, reloadKey])


  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="text-red-600 text-lg">
          {error}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setReloadKey((key) => key + 1)}
            className="bg-emerald-600 text-white px-5 py-2 rounded-xl hover:opacity-90 transition">
            Try again
          </button>
          <button
            onClick={() => navigate("/history")}
            className="bg-gray-100 text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-200 transition">
            Back to history
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">
          Loading Report...
        </p>
      </div>
    );
  }

  return <Step3Report report={report}/>
}

export default InterviewReport
