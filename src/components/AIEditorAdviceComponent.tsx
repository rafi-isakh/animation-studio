

"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { ElementType, ElementSubtype } from '@/components/Types';
import markdownToHtml from '@/utils/markdown';
import { CircularProgress } from '@mui/material';

const AIEditorAdviceComponent = ({ content, novelLanguage }: { content: string, novelLanguage: string }) => {
  const [text, setText] = useState("");
  const { language, isRtl } = useLanguage();
  const initialized = useRef(false);
  const fetchRef = useRef(false);
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    const handleSendText = async () => {
      // elmeentId is either chapter_id (for chapter title) or webnovel_id (for webnovel title and description) or user_id (for user bio)
      submitContent(content);
      initialized.current = true;
    }
    handleSendText();
  }, []);



  const submitContent = async (translation: string) => {
    if (!translation) translation = "";
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/send_content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'original': content,
        })
      });

      if (response.ok) {
        const data = await response.json();
        startEventSource(data.text_id);
      } else {
        console.error('Failed to submit words');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const startEventSource = (textId: string) => {
    setLoading(false);
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_advice/${textId}?novel_language=${novelLanguage}`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.ended == 0) {
        setText(text => text + data.token);
      } else if (data.ended == 1) {
        setFinished(true);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  };

  type Direction = 'ltr' | 'rtl';

  return (
    <div style={{ direction: `${isRtl}` as Direction }}>
      {
        loading ?
          <div role="status" className='w-4'>
            {/*Spinny*/}
            <CircularProgress color='secondary' />
          </div> :
          <div dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }}>
          </div>
      }
    </div>
  );
};

export default AIEditorAdviceComponent;