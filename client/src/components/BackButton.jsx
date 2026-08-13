import React from 'react'
import { FaArrowLeft } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

function BackButton({ to, className = 'mt-1' }) {
    const navigate = useNavigate()

    return (
        <button
            onClick={() => navigate(to)}
            className={`${className} p-3 rounded-full bg-white shadow hover:shadow-md transition`}>
            <FaArrowLeft className='text-gray-600' />
        </button>
    )
}

export default BackButton
