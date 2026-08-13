import React from 'react'
import { BsRobot } from 'react-icons/bs'

function BrandLogo({ iconSize = 18, className = '', titleClassName = 'font-semibold text-lg' }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className='bg-black text-white p-2 rounded-lg'>
                <BsRobot size={iconSize} />
            </div>
            <h2 className={titleClassName}>InterviewIQ.AI</h2>
        </div>
    )
}

export default BrandLogo
