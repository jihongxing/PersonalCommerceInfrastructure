/**
 * Simple toast hook - can be replaced with a proper library later
 */
export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  return {
    toast: (props: ToastProps) => {
      // 简单的实现：使用浏览器 alert
      // 生产环境应该使用 sonner 或其他库
      const message = props.description
        ? `${props.title}\n${props.description}`
        : props.title;
      
      if (props.variant === 'destructive') {
        console.error(message);
      } else {
        console.log(message);
      }
      
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    },
  };
}
