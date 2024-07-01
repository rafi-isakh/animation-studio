"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import WriteComponent from '@/components/WriteComponent';

const MyWebnovelsComponent = ({ email }: { email: string }) => {

  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  useEffect(() => {
    fetch(`http://localhost:5000/api/get_webnovel_byuser?user_email=${email}`)
      .then(response => response.json())
      .then(data => setWebnovels(data));
  }, []);
  return (
      <div>
          <center>
              {webnovels.map(webnovel => (
                  <>
                  <WebnovelComponent webnovel={webnovel}/>
                  <br/>
                  <WriteComponent webnovelId={webnovel.id} />
                  </>
              )
              )
              }
          </center>
      </div>
  );
};

export default MyWebnovelsComponent;

