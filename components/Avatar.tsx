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

  return <img src={userPhoto || '/default-avatar.png'} alt="User Avatar" className="w-24 h-24 rounded-full" />;
};

export default Avatar;
