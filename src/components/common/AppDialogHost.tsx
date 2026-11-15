import { useEffect, useState } from "react";

import AppDialog from "@/components/common/AppDialog";
import {
  subscribeToAppDialog,
  type AppDialogRequest,
} from "@/services/appDialogService";

export default function AppDialogHost() {
  const [request, setRequest] = useState<AppDialogRequest | null>(null);

  useEffect(() => subscribeToAppDialog(setRequest), []);

  return (
    <AppDialog
      visible={request !== null}
      title={request?.title ?? ""}
      message={request?.message}
      buttons={request?.buttons}
      onConfirm={() => setRequest(null)}
      onDismiss={() => setRequest(null)}
    />
  );
}
