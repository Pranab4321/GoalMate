import type { AppDialogButton } from "@/components/common/AppDialog";

export type AppDialogRequest = {
  title: string;
  message?: string;
  buttons?: AppDialogButton[];
};

type Listener = (request: AppDialogRequest | null) => void;

let listener: Listener | null = null;

export function subscribeToAppDialog(nextListener: Listener): () => void {
  listener = nextListener;
  return () => {
    if (listener === nextListener) {
      listener = null;
    }
  };
}

/**
 * Drop-in styled replacement for React Native Alert.alert(title, message, buttons).
 * Existing button callbacks and cancel/destructive styles are retained.
 */
export function showAppDialog(
  title: string,
  message?: string,
  buttons?: AppDialogButton[],
): void {
  listener?.({
    title,
    message,
    buttons: buttons?.map((button) => ({ ...button })),
  });
}
