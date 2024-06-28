import WebnovelComponent from "@/components/WebnovelComponent";

async function fetchWebnovel(id: string) {
  const res = await fetch(`http://localhost:5000/api/get_webnovel_byid?id=${id}`,
                        {cache: 'force-cache'}
  )

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }

  const data = await res.json();
  return data;
}

export default async function NovelView({
  params: { id },
}: {
  params: { id: string }
}) {
    const webnovel = await fetchWebnovel(id);
    return <div>
              <center>
                <WebnovelComponent webnovel={webnovel}/>
              </center>
            </div>
}
