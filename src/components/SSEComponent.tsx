"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';

const SSEComponent = ({ content, chapterId }: { content: string, chapterId: string }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState('Loading');
  const { language } = useLanguage();
  const initialized = useRef(false);
  const fetchRef = useRef(false);
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (fetchRef.current) return;
    fetchRef.current = true;

    const handleTranslate = async () => {
      const response = await fetch(`http://localhost:5000/api/get_translation?id=${chapterId}&language=${language}`)
      const data = await response.json();
      if (data.text) {
        setText(data.text)
      }

      // If there's no translation in the DB
      // initialized.current is bc useEffect runs twice
      if (!data.text && !initialized.current) {

        submitContent();
        initialized.current = true;
      }
    }
    handleTranslate();
  }, []);

  useEffect(() => {
    if (initialized.current) {
      saveTranslationToDB();
    }
  }, [finished])

  const saveTranslationToDB = async () => {
    if (text) {
      const data = {
        "text": text,
        "language": language,
        "chapterId": chapterId
      }
      const res = await fetch('http://localhost:5000/api/save_translation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        console.error("Saving translation to DB failed");
      } else {
        console.log("Successfully saved")
      }
    }
  }

  const submitContent = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/send_content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'text': content
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

  const newlineToBr = (text: string) => {
    text = text.replaceAll("\r\n", "<br>");
    text = text.replaceAll("\n", "<br>");
    return text;
  }

  const startEventSource = (textId: string, cvid: string = '', to_continue: number = 0) => {
    const eventSource = new EventSource(`http://localhost:5000/api/translate/${textId}?target=${language}&cvid=${cvid}&to_continue=${to_continue}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // if translation is complete, save to DB
      if (data.ended == 0) {
        setText(text => text + data.token);
      } else if (data.ended == 1) {
        setFinished(true);
      } else if (data.ended == -1) { // continue case
        eventSource.close();
        startEventSource(textId, data.cvid, 1);
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

  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>

      {text}
    </div>
  );
};

export default SSEComponent;