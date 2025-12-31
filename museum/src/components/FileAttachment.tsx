import React, { useRef } from "react";
import { X, Paperclip, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileAttachment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FileAttachmentProps {
  onAttachmentChange: (attachments: FileAttachment[]) => void;
  currentAttachments: FileAttachment[];
  maxFiles?: number;
  maxSize?: number; // in MB
}

export function FileAttachmentButton({
  onAttachmentChange,
  currentAttachments,
  maxFiles = 5,
  maxSize = 10,
}: FileAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    // Check if adding these files would exceed the max count
    if (currentAttachments.length + e.target.files.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Too many files",
        description: `You can only attach up to ${maxFiles} files at once.`,
      });
      return;
    }

    const selectedFiles = Array.from(e.target.files);
    const formData = new FormData();

    // Validate file sizes
    for (const file of selectedFiles) {
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} exceeds the ${maxSize}MB limit.`,
        });
        return;
      }
      formData.append("files", file);
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload files");
      }

      const newAttachments: FileAttachment[] = await response.json();
      const updatedAttachments = [...currentAttachments, ...newAttachments];
      onAttachmentChange(updatedAttachments);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload files",
      });
    }
  };

  const removeFile = (index: number) => {
    const updatedAttachments = [...currentAttachments];
    updatedAttachments.splice(index, 1);
    onAttachmentChange(updatedAttachments);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        className="h-9 w-9 rounded-full"
      >
        <Paperclip className="h-4 w-4" />
        <span className="sr-only">Attach files</span>
      </Button>
      
      {currentAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {currentAttachments.map((file, index) => {
            const isImage = file.contentType.startsWith("image/");
            return (
              <div
                key={index}
                className="flex items-center gap-2 bg-secondary/80 p-2 pr-1 rounded-md max-w-[300px]"
              >
                {isImage ? (
                  <div className="h-8 w-8 overflow-hidden rounded">
                    <img src={file.url} alt={file.filename} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <FileIcon className="h-8 w-8" />
                  </div>
                )}
                <span className="text-sm flex-1 truncate">{file.filename}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0 ml-1"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Preview component for displaying attachments in messages
export function AttachmentPreview({ attachments }: { attachments: FileAttachment[] }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((attachment, index) => {
        const isImage = attachment.contentType.startsWith("image/");
        
        return (
          <a
            key={index}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center border rounded-md p-2 hover:bg-secondary/50"
          >
            {isImage ? (
              <div className="w-24 h-24 relative">
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="w-24 h-24 flex items-center justify-center bg-secondary/30 rounded-md">
                <FileIcon className="h-8 w-8 text-primary/70" />
              </div>
            )}
            <span className="mt-1 text-xs max-w-[96px] truncate text-center group-hover:text-primary">
              {attachment.filename}
            </span>
          </a>
        );
      })}
    </div>
  );
}