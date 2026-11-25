import { PASSWORD_MIN_LENGTH } from '@handle-it/contracts';
import { Link, useLocation } from 'react-router';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { PasswordField } from '../../shared/ui/password-field';
import { TextField } from '../../shared/ui/text-field';
import { useAuthGateway } from './auth-gateway-context';
import { AuthLayout } from './auth-layout';
import { registerFormSchema } from './register-form-schema';
import { useReplaceCurrentUser } from './use-current-user';

export function RegisterPage() {
  const authGateway = useAuthGateway();
  const replaceCurrentUser = useReplaceCurrentUser();
  const { state } = useLocation();
  const form = useSchemaForm({
    schema: registerFormSchema,
    submit: async (request) => replaceCurrentUser(await authGateway.register(request)),
    fieldByErrorCode: { EMAIL_ALREADY_USED: 'email' },
  });
  return (
    <AuthLayout title="Créer un compte">
      <title>Créer un compte · Handle It</title>
      <form
        ref={form.formReference}
        noValidate
        onSubmit={(event) => void form.handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <FormAlert message={form.formError} />
        <TextField
          label="Nom"
          name="displayName"
          autoComplete="name"
          errors={form.fieldErrors['displayName']}
        />
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
          autoComplete="new-password"
          hint={`${PASSWORD_MIN_LENGTH} caractères minimum`}
          errors={form.fieldErrors['password']}
        />
        <PasswordField
          label="Confirmer le mot de passe"
          name="passwordConfirmation"
          autoComplete="new-password"
          errors={form.fieldErrors['passwordConfirmation']}
        />
        <Button type="submit" disabled={form.isPending}>
          {form.isPending ? 'Création…' : 'Créer un compte'}
        </Button>
      </form>
      <p className="text-muted">
        Déjà un compte ?{' '}
        <Link to="/login" state={state} className="font-semibold text-ink underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}
