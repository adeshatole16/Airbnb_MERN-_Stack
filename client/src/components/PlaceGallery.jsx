import React, { useState } from 'react'

const PlaceGallery = ({ place }) => {
    const [showAllPhotos, setShowAllPhotos] = useState(false)

    if (showAllPhotos) {
        return (
            <div className='absolute inset-0 min-w-full min-h-screen bg-black p-8 grid gap-4 items-center justify-items-center'>
                <div className='text-white text-center'>
                    <h2 className='text-2xl mb-4'>Photos of {place.title}</h2>
                    <button onClick={() => setShowAllPhotos(false)} className='bg-primary px-4 py-2 rounded-full text-white'>
                        Close
                    </button>
                </div>
                {place.photos.map((photo, index) => (
                    <img key={index} src={photo} alt="" className='max-h-[80vh] rounded-xl' />
                ))}
            </div>
        )
    }

    return (
        <div className='relative'>
            <div className="grid gap-2 grid-cols-[2fr_1fr]">
                {place.photos[0] && (
                    <img
                        src={place.photos[0]}
                        className='cursor-pointer aspect-square object-cover rounded-tl-2xl rounded-bl-2xl'
                        onClick={() => setShowAllPhotos(true)}
                    />
                )}
                <div className='grid'>
                    {place.photos[1] && (
                        <img
                            src={place.photos[1]}
                            className='cursor-pointer aspect-square object-cover rounded-tr-2xl'
                            onClick={() => setShowAllPhotos(true)}
                        />
                    )}
                    {place.photos[2] && (
                        <img
                            src={place.photos[2]}
                            className='cursor-pointer aspect-square object-cover rounded-br-2xl relative top-2'
                            onClick={() => setShowAllPhotos(true)}
                        />
                    )}
                </div>
            </div>
            {place.photos.length > 3 && (
                <button
                    onClick={() => setShowAllPhotos(true)}
                    className='absolute bottom-2 right-2 py-2 px-2 bg-white rounded-2xl shadow-md'
                >
                    Show More Photos
                </button>
            )}
        </div>
    )
}

export default PlaceGallery
