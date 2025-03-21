import { Button } from '@heroui/button';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const Login = () => {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <Button onPress={signInWithGoogle} color="primary">
      Login with Google
    </Button>
  );
};

export default Login;