
async function fetchWebnovel(title: string) {
  const res = await fetch(`http://localhost:5000/api/get_webnovel?title=${title}`)

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

export default async function NovelView({
  params: { title },
}: {
  params: { title: string }
}) {
    const webnovel = await fetchWebnovel(title);
    return <div>
              <center>
                <p>Title: {title}</p>
                <p>Name: {webnovel[0].user_name}</p>
                <p>Content: {webnovel[0].content}</p>
              </center>
            </div>
}
