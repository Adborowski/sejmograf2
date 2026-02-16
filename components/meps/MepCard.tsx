'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Mep } from '@/types/mep';
import { getMepPhotoDirectURL } from '@/lib/firebase/storage';

interface MepCardProps {
  mep: Mep;
}

export default function MepCard({ mep }: MepCardProps) {
  const [imageError, setImageError] = useState(false);
  const photoUrl = getMepPhotoDirectURL(mep.id);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Photo */}
      <div className="relative h-48 bg-gray-200">
        {!imageError ? (
          <Image
            src={photoUrl}
            alt={mep.fullName}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-300 text-gray-600">
            <svg
              className="w-20 h-20"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {mep.fullName}
        </h3>

        {/* Club/Party */}
        {mep.club && (
          <p className="text-sm font-medium text-blue-600 mb-3">{mep.club}</p>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600">
          {mep.districtName && (
            <div className="flex items-start">
              <svg
                className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{mep.districtName}</span>
            </div>
          )}

          {mep.voivodeship && (
            <div className="flex items-start">
              <svg
                className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>{mep.voivodeship}</span>
            </div>
          )}

          {mep.profession && (
            <div className="flex items-start">
              <svg
                className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
              <span className="line-clamp-2">{mep.profession}</span>
            </div>
          )}

          {mep.email && (
            <div className="flex items-start">
              <svg
                className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <a
                href={`mailto:${mep.email}`}
                className="text-blue-600 hover:underline truncate"
              >
                {mep.email}
              </a>
            </div>
          )}
        </div>

        {/* Active Status */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              mep.active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {mep.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}
