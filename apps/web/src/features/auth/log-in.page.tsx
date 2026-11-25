import { logInRequestSchema } from '@handle-it/contracts';
import { Link, useLocation } from 'react-router';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { PasswordField } from '../../shared/ui/password-field';
import { TextField } from '../../shared/ui/text-field';
import { useAuthGateway } from './auth-gateway-context';
import { AuthLayout } from './auth-layout';
import { useReplaceCurrentUser } from './use-current-user';

export function LogInPage() {
  const authGateway = useAuthGateway();
  const replaceCurrentUser = useReplaceCurrentUser();
  const { state } = useLocation();
  const form = useSchemaForm({
    schema: logInRequestSchema,
    submit: async (request) => replaceCurrentUser(await authGateway.logIn(request)),
  });
  return (
    <AuthLayout title="Se connecter">
      <title>Se connecter · Handle It</title>
      <form
        ref={form.formReference}
        noValidate
        onSubmit={(event) => void form.handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <FormAlert message={form.formError} />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="username"
          errors={form.fieldErrors['email']}
        />
        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          errors={form.fieldErrors['password']}
        />
        <Button type="submit" disabled={form.isPending}>
          {form.isPending ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
      <p className="text-muted">
        Pas encore de compte ?{' '}
        <Link to="/register" state={state} className="font-semibold text-ink underline">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  );
}
