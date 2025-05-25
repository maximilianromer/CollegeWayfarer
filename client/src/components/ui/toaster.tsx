import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Ensure safe serialization of title and description
        const safeTitle = title && typeof title === 'object' ? 
          JSON.stringify(title, null, 2) : 
          title;
        
        // Safely handle different types of description, including Error objects
        let safeDesc = description;
        if (description) {
          if (description instanceof Error) {
            safeDesc = description.message;
          } else if (typeof description === 'object') {
            try {
              safeDesc = JSON.stringify(description, null, 2);
            } catch (e) {
              safeDesc = "Error description could not be displayed";
            }
          }
        }
        
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {safeTitle && <ToastTitle>{safeTitle}</ToastTitle>}
              {safeDesc && <ToastDescription>{safeDesc}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
