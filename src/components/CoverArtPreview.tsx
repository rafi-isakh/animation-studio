import { Link } from "@mui/material";
import Image from "next/image";

export default function CoverArtPreview(
    { coverArt, handleCoverArtUploadModal }:
        { coverArt: File | null, handleCoverArtUploadModal: (e: React.MouseEvent) => void }) {
    return (
        <Link href="#" className=''>
            {coverArt ?
                <div className="w-[200px] h-[333px]">
                    <a onClick={handleCoverArtUploadModal} >
                        <Image
                            src={URL.createObjectURL(coverArt)}
                            alt="Cover Art Preview"
                            className="max-w-xs object-scale-down rounded"
                            width={200} height={333}
                        />
                    </a>
                </div> :
                <div className='w-[200px] h-[333px]'>
                    <Image
                        src='/coverArt_thumbnail.png'
                        alt='Cover Art Thubmnail'
                        onClick={handleCoverArtUploadModal}
                        className="max-w-xs rounded"
                        width={200} height={333}
                    />
                </div>
            }
        </Link>
    )
}