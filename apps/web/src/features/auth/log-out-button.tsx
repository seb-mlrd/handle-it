import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '../../shared/http/error-message';
import { Button } from '../../shared/ui/button';
import { useAuthGateway } from './auth-gateway-context';
import { useReplaceCurrentUser } from './use-current-user';

export function LogOutButton() {
  const authGateway = useAuthGateway();
  const replaceCurrentUser = useReplaceCurrentUser();
  const logOut = useMutation({
    mutationFn: () => authGateway.logOut(),
    onSuccess: () => replaceCurrentUser(null),
  });
  return (
    <div className="flex shrink-0 items-center justify-end gap-3">
      <span role="alert" className="text-sm text-danger">
        {logOut.error && getErrorMessage(logOut.error)}
      </span>
      <Button variant="ghost" disabled={logOut.isPending} onClick={() => logOut.mutate()}>
        Se déconnecter
      </Button>
    </div>
  );
}
