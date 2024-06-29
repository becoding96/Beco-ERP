import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";

interface LottieComponentProps {
  name: string;
}

const LottieComponent: React.FC<LottieComponentProps> = ({ name }) => {
  const [animation, setAnimation] = useState<object | null>(null);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const animationData = await import(`../../public/lottie/${name}.json`);
        setAnimation(animationData.default);
      } catch (err) {
        console.error(err);
      }
    };

    loadAnimation();
  }, [name]);

  if (!animation)
    return (
      <div
        style={{
          width: "20rem",
          height: "20rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(250, 250, 250, 0.5)",
          borderRadius: "10px",
          fontWeight: "bold",
        }}
      >
        Loading...
      </div>
    );
  return (
    <Lottie
      animationData={animation}
      loop={true}
      style={{ width: "20rem", height: "20rem" }}
    />
  );
};

export default LottieComponent;
