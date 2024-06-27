'use client';

import React, {useState} from 'react';
import { useAuth } from '@/components/AuthContext';

const ProfileComponent = ({ user }: { user: { name: string, image: string } }) => {
  const { setIsLoggedIn } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverArt, setCoverArt] = useState<File | null>(null);

  const handleSignOut = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/signout', {
        method: 'POST',
      });
      if (response.ok) {
        setIsLoggedIn(false);
        window.location.href = '/';
      } else {
        console.error('Failed to sign out');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddWebnovel = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (coverArt) {
      formData.append('coverArt', coverArt)
    }

    const res = await fetch('/api/add-webnovel', {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <div>
      <center>
        <h2>{user.name}</h2>
        {<img src={user.image} alt="Profile" />}
        <form onSubmit={handleSignOut}>
          <button type="submit">Sign out</button>
        </form>
        <form onSubmit={handleAddWebnovel}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setCoverArt(e.target.files[0])}
              }
            }
          />
          <button type="submit">Add Webnovel</button>
        </form>
      </center>
    </div>
  );
};

export default ProfileComponent;
