"use client";

import React, { useState, useEffect } from "react";

const DRIVE_SETTINGS_KEY = "driveApiSettings";

interface DriveSettingsData {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
}

interface DriveSettingsProps {
  onClose?: () => void;
}

export default function DriveSettings({ onClose }: DriveSettingsProps) {
  const [settings, setSettings] = useState<DriveSettingsData>({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    folderId: "",
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(DRIVE_SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (
          parsedSettings.clientId ||
          parsedSettings.clientSecret ||
          parsedSettings.refreshToken ||
          parsedSettings.folderId
        ) {
          setSettings(parsedSettings);
        }
      } catch (e) {
        console.error("Failed to parse drive settings from local storage", e);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(DRIVE_SETTINGS_KEY, JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const inputClass =
    "w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none transition duration-200 text-gray-900 dark:text-gray-200 placeholder-gray-500";

  return (
    <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/80">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Google Drive 설정
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Google Drive API 자격 증명을 입력하세요. 이 정보는 브라우저에 로컬로
        저장됩니다.
      </p>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="clientId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1"
          >
            Client ID
          </label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            value={settings.clientId}
            onChange={handleChange}
            className={inputClass}
            placeholder="your-client-id.apps.googleusercontent.com"
          />
        </div>
        <div>
          <label
            htmlFor="clientSecret"
            className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1"
          >
            Client Secret
          </label>
          <input
            type="password"
            id="clientSecret"
            name="clientSecret"
            value={settings.clientSecret}
            onChange={handleChange}
            className={inputClass}
            placeholder="GOCSPX-..."
          />
        </div>
        <div>
          <label
            htmlFor="refreshToken"
            className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1"
          >
            Refresh Token
          </label>
          <input
            type="password"
            id="refreshToken"
            name="refreshToken"
            value={settings.refreshToken}
            onChange={handleChange}
            className={inputClass}
            placeholder="1//..."
          />
        </div>
        <div>
          <label
            htmlFor="folderId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1"
          >
            Folder ID
          </label>
          <input
            type="text"
            id="folderId"
            name="folderId"
            value={settings.folderId}
            onChange={handleChange}
            className={inputClass}
            placeholder="1abc..."
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#DB2777] hover:bg-[#BE185D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DB2777] transition-colors"
        >
          설정 저장
        </button>
        {isSaved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            저장되었습니다!
          </span>
        )}
      </div>
    </div>
  );
}
