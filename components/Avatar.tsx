import { Avatar as HeroUIAvatar } from '@heroui/avatar';
import { auth } from '../firebase';
import { useEffect, useState } from 'react';

const Avatar = () => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserPhoto(user?.photoURL || null);
    });
    return () => unsubscribe();
  }, []);

  return <HeroUIAvatar src={userPhoto || '/default-avatar.png'} size="lg" />;
};

export default Avatar;