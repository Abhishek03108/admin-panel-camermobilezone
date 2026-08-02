import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadsApi } from "../../api/uploads.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";

/**
 * Single-image uploader. Uploads immediately to Cloudinary via the admin
 * upload endpoint and reports back { url, publicId } through onUploaded.
 */
export default function ImageUploader({ value, onUploaded, folder = "misc", label = "Image" }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadsApi.uploadImage(file, folder);
      onUploaded(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {label && <p className="label">{label}</p>}
      <div
        className="relative w-full h-40 rounded-xl border-2 border-dashed border-line bg-panel/60 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUploaded(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-muted hover:text-danger"
            >
              <X size={14} />
            </button>
          </>
        ) : isUploading ? (
          <Loader2 size={20} className="animate-spin text-muted" />
        ) : (
          <div className="flex flex-col items-center text-muted text-sm gap-1.5">
            <ImagePlus size={22} />
            <span>Click to upload</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
