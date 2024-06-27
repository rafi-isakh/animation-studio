'use client';

import React, {useState} from 'react';
import { useAuth } from '@/components/AuthContext';

const ProfileComponent = ({ user }: { user: { name: string, image: string } }) => {
  const { setIsLoggedIn } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverArt, setCoverArt] = useState('');

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

    const res = await fetch('/api/add-webnovel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content, coverArt }),
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
            type="text"
            placeholder="Cover Art"
            value={coverArt}
            onChange={(e) => setCoverArt(e.target.value)}
          />
          <button type="submit">Add Webnovel</button>
        </form>
      </center>
    </div>
  );
};

export default ProfileComponent;
