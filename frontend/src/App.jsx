import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [objects, setObjects] = useState([]);
  const [status, setStatus] = useState("Camera Off");

  const [location, setLocation] = useState(null);

  const [destination, setDestination] = useState("");
  const [routeInfo, setRouteInfo] = useState("");
  const [navigationOn, setNavigationOn] = useState(false);
  const [currentInstruction, setCurrentInstruction] =
    useState("");

  const [language, setLanguage] = useState("en-US");

  const watchIdRef = useRef(null);

  const navigationStepsRef = useRef([]);
  const nextStepRef = useRef(1);

  const lastNavigationVoiceRef = useRef("");
  const lastObjectVoiceRef = useRef("");
  const lastObjectVoiceTimeRef = useRef(0);

  // ----------------------------------------
  // NATURAL MULTILINGUAL VOICE
  // ----------------------------------------

  const audioRef = useRef(null);

  const speak = async (message) => {
    if (!message) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const response = await fetch("http://127.0.0.1:5001/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error("TTS server error");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audioRef.current = audio;
      audio.preload = "auto";

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      await audio.play();
    } catch (error) {
      console.error("Voice error:", error);
      console.warn(
        "Make sure tts_server.py is running on http://127.0.0.1:5001"
      );
    }
  };

  // ----------------------------------------
  // CAMERA
  // ----------------------------------------

  const startCamera = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: false,
          }
        );

      videoRef.current.srcObject =
        stream;

      setCameraOn(true);
      setStatus("AI Detection Active");

      if (language === "ta-IN") {
        speak(
          "கேமரா தொடங்கிடுச்சு. AI இப்போ வேலை செய்கிறது."
        );
      } else if (
        language === "hi-IN"
      ) {
        speak(
          "कैमरा शुरू हो गया है। AI अब काम कर रहा है।"
        );
      } else if (
        language === "fr-FR"
      ) {
        speak(
          "La caméra est démarrée. L'IA fonctionne maintenant."
        );
      } else if (
        language === "es-ES"
      ) {
        speak(
          "La cámara está encendida. La IA está funcionando."
        );
      } else {
        speak(
          "Camera started. AI vision is active."
        );
      }
    } catch (error) {
      console.error(error);

      setStatus(
        "Camera Permission Denied"
      );

      if (language === "ta-IN") {
        speak(
          "கேமரா permission கிடைக்கவில்லை."
        );
      } else if (
        language === "hi-IN"
      ) {
        speak(
          "कैमरा permission नहीं मिली।"
        );
      } else if (
        language === "fr-FR"
      ) {
        speak(
          "L'autorisation de la caméra a été refusée."
        );
      } else if (
        language === "es-ES"
      ) {
        speak(
          "No se ha permitido el acceso a la cámara."
        );
      } else {
        speak(
          "Camera permission was denied."
        );
      }
    }
  };

  const stopCamera = () => {
    const stream =
      videoRef.current?.srcObject;

    if (stream) {
      stream
        .getTracks()
        .forEach((track) =>
          track.stop()
        );
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraOn(false);
    setObjects([]);
    setStatus("Camera Off");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // ----------------------------------------
  // GPS
  // ----------------------------------------

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setRouteInfo(
        "GPS is not supported by this browser."
      );

      speak(
        language === "ta-IN"
          ? "இந்த browser-ல GPS support இல்லை."
          : language === "hi-IN"
          ? "इस browser में GPS support नहीं है।"
          : language === "fr-FR"
          ? "Le GPS n'est pas pris en charge par ce navigateur."
          : language === "es-ES"
          ? "Este navegador no admite GPS."
          : "GPS is not supported by this browser."
      );

      return;
    }

    setRouteInfo(
      language === "ta-IN"
        ? "உங்க location-ஐ கண்டுபிடிக்கிறேன்..."
        : language === "hi-IN"
        ? "आपकी location ढूंढ रहा हूं..."
        : language === "fr-FR"
        ? "Je cherche votre position..."
        : language === "es-ES"
        ? "Buscando tu ubicación..."
        : "Getting your current location..."
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat:
            position.coords.latitude,
          lon:
            position.coords.longitude,
          accuracy:
            position.coords.accuracy,
        };

        setLocation(newLocation);

        setRouteInfo(
          language === "ta-IN"
            ? `Location கிடைத்துவிட்டது. Accuracy சுமார் ${Math.round(
                position.coords.accuracy
              )} மீட்டர்.`
            : language === "hi-IN"
            ? `Location मिल गई। Accuracy लगभग ${Math.round(
                position.coords.accuracy
              )} मीटर है।`
            : language === "fr-FR"
            ? `Position trouvée. Précision d'environ ${Math.round(
                position.coords.accuracy
              )} mètres.`
            : language === "es-ES"
            ? `Ubicación encontrada. Precisión de unos ${Math.round(
                position.coords.accuracy
              )} metros.`
            : `Location found. Accuracy: approximately ${Math.round(
                position.coords.accuracy
              )} meters.`
        );

        speak(
          language === "ta-IN"
            ? "உங்க current location கிடைத்துவிட்டது."
            : language === "hi-IN"
            ? "आपकी current location मिल गई है।"
            : language === "fr-FR"
            ? "Votre position actuelle a été trouvée."
            : language === "es-ES"
            ? "He encontrado tu ubicación actual."
            : "Your current location has been found."
        );

        if (
          watchIdRef.current !== null
        ) {
          navigator.geolocation.clearWatch(
            watchIdRef.current
          );
        }

        watchIdRef.current =
          navigator.geolocation.watchPosition(
            (newPosition) => {
              setLocation({
                lat:
                  newPosition.coords
                    .latitude,
                lon:
                  newPosition.coords
                    .longitude,
                accuracy:
                  newPosition.coords
                    .accuracy,
              });
            },
            (error) => {
              console.error(
                "GPS watch error:",
                error
              );
            },
            {
              enableHighAccuracy: true,
              maximumAge: 3000,
              timeout: 10000,
            }
          );
      },
      (error) => {
        console.error(error);

        setRouteInfo(
          language === "ta-IN"
            ? "Location கிடைக்கவில்லை. GPS permission கொடுங்க."
            : language === "hi-IN"
            ? "Location नहीं मिली। GPS permission दें।"
            : language === "fr-FR"
            ? "Impossible d'obtenir votre position."
            : language === "es-ES"
            ? "No se pudo obtener tu ubicación."
            : "Unable to get location. Please allow location permission."
        );

        speak(
          language === "ta-IN"
            ? "உங்க location கிடைக்கவில்லை. GPS permission கொடுங்க."
            : language === "hi-IN"
            ? "आपकी location नहीं मिली। GPS permission दें।"
            : language === "fr-FR"
            ? "Je n'ai pas pu obtenir votre position."
            : language === "es-ES"
            ? "No pude obtener tu ubicación."
            : "I could not get your location. Please allow your location permission."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  };

  // ----------------------------------------
  // DISTANCE
  // ----------------------------------------

  const calculateDistance = (
    lat1,
    lon1,
    lat2,
    lon2
  ) => {
    const earthRadius = 6371000;

    const toRadians = (value) =>
      (value * Math.PI) / 180;

    const dLat = toRadians(
      lat2 - lat1
    );

    const dLon = toRadians(
      lon2 - lon1
    );

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadius * c;
  };

  // ----------------------------------------
  // NATURAL NAVIGATION LANGUAGE
  // ----------------------------------------

  const createInstruction = (step) => {
    if (
      !step ||
      !step.maneuver
    ) {
      if (language === "ta-IN")
        return "தொடர்ந்து போங்க";

      if (language === "hi-IN")
        return "आगे चलते रहिए";

      if (language === "fr-FR")
        return "Continuez à marcher";

      if (language === "es-ES")
        return "Sigue caminando";

      return "Continue walking";
    }

    const type =
      step.maneuver.type;

    const modifier =
      step.maneuver.modifier;

    const street =
      step.name || "";

    // TAMIL
    if (language === "ta-IN") {
      if (type === "depart") {
        return street
          ? `${street} வழியா போக ஆரம்பிங்க`
          : "போக ஆரம்பிங்க";
      }

      if (type === "turn") {
        if (
          modifier === "left"
        ) {
          return street
            ? `${street}ல இடப்பக்கம் திரும்புங்க`
            : "இடப்பக்கம் திரும்புங்க";
        }

        if (
          modifier === "right"
        ) {
          return street
            ? `${street}ல வலப்பக்கம் திரும்புங்க`
            : "வலப்பக்கம் திரும்புங்க";
        }

        if (
          modifier === "slight left"
        ) {
          return "கொஞ்சம் இடப்பக்கம் திரும்புங்க";
        }

        if (
          modifier === "slight right"
        ) {
          return "கொஞ்சம் வலப்பக்கம் திரும்புங்க";
        }
      }

      if (
        type === "continue"
      ) {
        return street
          ? `${street}ல நேரா போங்க`
          : "நேரா போங்க";
      }

      if (
        type === "roundabout"
      ) {
        return "ரவுண்டானாவுக்குள் போய் தொடர்ந்து போங்க";
      }

      if (type === "arrive") {
        return "நீங்க destination-க்கு வந்துட்டீங்க";
      }

      return "தொடர்ந்து போங்க";
    }

    // HINDI
    if (language === "hi-IN") {
      if (type === "depart") {
        return street
          ? `${street} से चलना शुरू करें`
          : "चलना शुरू करें";
      }

      if (type === "turn") {
        if (
          modifier === "left"
        ) {
          return street
            ? `${street} पर बाएं मुड़ें`
            : "बाएं मुड़ें";
        }

        if (
          modifier === "right"
        ) {
          return street
            ? `${street} पर दाएं मुड़ें`
            : "दाएं मुड़ें";
        }

        if (
          modifier === "slight left"
        ) {
          return "थोड़ा बाएं मुड़ें";
        }

        if (
          modifier === "slight right"
        ) {
          return "थोड़ा दाएं मुड़ें";
        }
      }

      if (
        type === "continue"
      ) {
        return street
          ? `${street} पर सीधे चलते रहें`
          : "सीधे चलते रहें";
      }

      if (
        type === "roundabout"
      ) {
        return "राउंडअबाउट में जाकर आगे बढ़ें";
      }

      if (type === "arrive") {
        return "आप destination पर पहुंच गए हैं";
      }

      return "आगे चलते रहें";
    }

    // FRENCH
    if (language === "fr-FR") {
      if (type === "depart") {
        return street
          ? `Commencez à marcher sur ${street}`
          : "Commencez à marcher";
      }

      if (type === "turn") {
        if (
          modifier === "left"
        ) {
          return street
            ? `Tournez à gauche sur ${street}`
            : "Tournez à gauche";
        }

        if (
          modifier === "right"
        ) {
          return street
            ? `Tournez à droite sur ${street}`
            : "Tournez à droite";
        }

        if (
          modifier === "slight left"
        ) {
          return "Tournez légèrement à gauche";
        }

        if (
          modifier === "slight right"
        ) {
          return "Tournez légèrement à droite";
        }
      }

      if (
        type === "continue"
      ) {
        return street
          ? `Continuez tout droit sur ${street}`
          : "Continuez tout droit";
      }

      if (
        type === "roundabout"
      ) {
        return "Entrez dans le rond-point et continuez";
      }

      if (type === "arrive") {
        return "Vous êtes arrivé à destination";
      }

      return "Continuez à marcher";
    }

    // SPANISH
    if (language === "es-ES") {
      if (type === "depart") {
        return street
          ? `Empieza a caminar por ${street}`
          : "Empieza a caminar";
      }

      if (type === "turn") {
        if (
          modifier === "left"
        ) {
          return street
            ? `Gira a la izquierda por ${street}`
            : "Gira a la izquierda";
        }

        if (
          modifier === "right"
        ) {
          return street
            ? `Gira a la derecha por ${street}`
            : "Gira a la derecha";
        }

        if (
          modifier === "slight left"
        ) {
          return "Gira un poco a la izquierda";
        }

        if (
          modifier === "slight right"
        ) {
          return "Gira un poco a la derecha";
        }
      }

      if (
        type === "continue"
      ) {
        return street
          ? `Sigue recto por ${street}`
          : "Sigue recto";
      }

      if (
        type === "roundabout"
      ) {
        return "Entra en la rotonda y continúa";
      }

      if (type === "arrive") {
        return "Has llegado a tu destino";
      }

      return "Sigue caminando";
    }

    // ENGLISH
    if (type === "depart") {
      return street
        ? `Start walking on ${street}`
        : "Start walking";
    }

    if (type === "turn") {
      if (
        modifier === "left"
      ) {
        return street
          ? `Turn left onto ${street}`
          : "Turn left";
      }

      if (
        modifier === "right"
      ) {
        return street
          ? `Turn right onto ${street}`
          : "Turn right";
      }

      if (
        modifier === "slight left"
      ) {
        return "Turn slightly left";
      }

      if (
        modifier === "slight right"
      ) {
        return "Turn slightly right";
      }
    }

    if (
      type === "continue"
    ) {
      return street
        ? `Continue straight on ${street}`
        : "Continue straight";
    }

    if (
      type === "roundabout"
    ) {
      return street
        ? `Enter the roundabout and continue on ${street}`
        : "Enter the roundabout";
    }

    if (type === "arrive") {
      return "You have arrived at your destination";
    }

    return street
      ? `Continue on ${street}`
      : "Continue walking";
  };

  // ----------------------------------------
  // START NAVIGATION
  // ----------------------------------------

  const startNavigation = async () => {
    if (!destination.trim()) {
      setRouteInfo(
        language === "ta-IN"
          ? "Destination enter பண்ணுங்க."
          : language === "hi-IN"
          ? "कृपया destination डालें।"
          : language === "fr-FR"
          ? "Veuillez entrer une destination."
          : language === "es-ES"
          ? "Introduce un destino."
          : "Please enter a destination."
      );

      speak(
        language === "ta-IN"
          ? "Destination enter பண்ணுங்க."
          : language === "hi-IN"
          ? "कृपया destination डालें।"
          : language === "fr-FR"
          ? "Veuillez entrer une destination."
          : language === "es-ES"
          ? "Introduce un destino."
          : "Please enter a destination."
      );

      return;
    }

    if (!location) {
      setRouteInfo(
        language === "ta-IN"
          ? "முதல்ல உங்க current location எடுத்துக்கோங்க."
          : language === "hi-IN"
          ? "पहले अपनी current location लें।"
          : language === "fr-FR"
          ? "Obtenez d'abord votre position actuelle."
          : language === "es-ES"
          ? "Primero obtén tu ubicación actual."
          : "Please get your current location first."
      );

      speak(
        language === "ta-IN"
          ? "முதல்ல உங்க current location எடுத்துக்கோங்க."
          : language === "hi-IN"
          ? "पहले अपनी current location लें।"
          : language === "fr-FR"
          ? "Obtenez d'abord votre position actuelle."
          : language === "es-ES"
          ? "Primero obtén tu ubicación actual."
          : "Please get your current location first."
      );

      return;
    }

    try {
      setRouteInfo(
        language === "ta-IN"
          ? "Destination தேடுறேன்..."
          : language === "hi-IN"
          ? "Destination ढूंढ रहा हूं..."
          : language === "fr-FR"
          ? "Recherche de la destination..."
          : language === "es-ES"
          ? "Buscando destino..."
          : "Finding destination..."
      );

      setNavigationOn(false);
      setCurrentInstruction("");

      const searchUrl =
        `https://nominatim.openstreetmap.org/search` +
        `?format=jsonv2` +
        `&limit=1` +
        `&q=${encodeURIComponent(
          destination
        )}`;

      const searchResponse =
        await fetch(searchUrl);

      if (!searchResponse.ok) {
        throw new Error(
          "Destination search failed"
        );
      }

      const places =
        await searchResponse.json();

      if (
        !places ||
        places.length === 0
      ) {
        setRouteInfo(
          language === "ta-IN"
            ? "இந்த destination கிடைக்கல."
            : language === "hi-IN"
            ? "यह destination नहीं मिला।"
            : language === "fr-FR"
            ? "Cette destination est introuvable."
            : language === "es-ES"
            ? "No se encontró este destino."
            : "Destination not found."
        );

        speak(
          language === "ta-IN"
            ? "இந்த destination கிடைக்கல."
            : language === "hi-IN"
            ? "यह destination नहीं मिला।"
            : language === "fr-FR"
            ? "Cette destination est introuvable."
            : language === "es-ES"
            ? "No se encontró este destino."
            : "I could not find that destination."
        );

        return;
      }

      const destinationLat =
        parseFloat(places[0].lat);

      const destinationLon =
        parseFloat(places[0].lon);

      const destinationName =
        places[0].display_name ||
        destination;

      setRouteInfo(
        language === "ta-IN"
          ? "Walking route calculate பண்றேன்..."
          : language === "hi-IN"
          ? "Walking route निकाल रहा हूं..."
          : language === "fr-FR"
          ? "Calcul de l'itinéraire à pied..."
          : language === "es-ES"
          ? "Calculando la ruta a pie..."
          : "Calculating walking route..."
      );

      const routeUrl =
        `https://router.project-osrm.org/route/v1/foot/` +
        `${location.lon},${location.lat};` +
        `${destinationLon},${destinationLat}` +
        `?overview=false&steps=true`;

      const routeResponse =
        await fetch(routeUrl);

      if (!routeResponse.ok) {
        throw new Error(
          "Route request failed"
        );
      }

      const routeData =
        await routeResponse.json();

      if (
        !routeData.routes ||
        routeData.routes.length === 0
      ) {
        setRouteInfo(
          language === "ta-IN"
            ? "Walking route கிடைக்கல."
            : language === "hi-IN"
            ? "Walking route नहीं मिली।"
            : language === "fr-FR"
            ? "Itinéraire à pied introuvable."
            : language === "es-ES"
            ? "No se encontró una ruta a pie."
            : "Walking route not found."
        );

        return;
      }

      const route =
        routeData.routes[0];

      const distance =
        Math.round(route.distance);

      const duration =
        Math.round(
          route.duration / 60
        );

      const steps =
        route.legs?.[0]?.steps || [];

      const navigationSteps =
        steps
          .filter(
            (step) => step.maneuver
          )
          .map((step) => ({
            instruction:
              createInstruction(step),

            distance:
              Math.round(
                step.distance || 0
              ),

            location: {
              lat:
                step.maneuver
                  .location[1],

              lon:
                step.maneuver
                  .location[0],
            },

            type:
              step.maneuver.type,
          }));

      navigationStepsRef.current =
        navigationSteps;

      nextStepRef.current = 1;

      setRouteInfo(
        language === "ta-IN"
          ? `Route கிடைத்துவிட்டது. Distance: ${distance} மீட்டர். சுமார் ${duration} நிமிஷம் ஆகும்.`
          : language === "hi-IN"
          ? `Route मिल गया। Distance: ${distance} मीटर। लगभग ${duration} मिनट लगेंगे।`
          : language === "fr-FR"
          ? `Itinéraire trouvé. Distance : ${distance} mètres. Environ ${duration} minutes.`
          : language === "es-ES"
          ? `Ruta encontrada. Distancia: ${distance} metros. Unos ${duration} minutos.`
          : `Route found. Distance: ${distance} meters. Estimated walking time: ${duration} minutes.`
      );

      setNavigationOn(true);

      if (
        navigationSteps.length > 1
      ) {
        const firstStep =
          navigationSteps[1];

        setCurrentInstruction(
          `${firstStep.instruction} in ${firstStep.distance} meters`
        );

        if (language === "ta-IN") {
          speak(
            `${destinationName} போக navigation ஆரம்பிச்சுட்டேன். ${firstStep.distance} மீட்டர் கழிச்சு ${firstStep.instruction}.`
          );
        } else if (
          language === "hi-IN"
        ) {
          speak(
            `${destinationName} के लिए navigation शुरू हो गया है। ${firstStep.distance} मीटर बाद ${firstStep.instruction}.`
          );
        } else if (
          language === "fr-FR"
        ) {
          speak(
            `Navigation vers ${destinationName} démarrée. ${firstStep.instruction} dans ${firstStep.distance} mètres.`
          );
        } else if (
          language === "es-ES"
        ) {
          speak(
            `Navegación hacia ${destinationName} iniciada. ${firstStep.instruction} en ${firstStep.distance} metros.`
          );
        } else {
          speak(
            `Navigation started to ${destinationName}. ${firstStep.instruction} in ${firstStep.distance} meters.`
          );
        }

        lastNavigationVoiceRef.current =
          firstStep.instruction;
      } else {
        speak(
          language === "ta-IN"
            ? `${destinationName} போக navigation ஆரம்பிச்சுட்டேன். Distance ${distance} மீட்டர்.`
            : language === "hi-IN"
            ? `${destinationName} के लिए navigation शुरू हो गया है। Distance ${distance} मीटर है।`
            : language === "fr-FR"
            ? `Navigation vers ${destinationName} démarrée. La distance est de ${distance} mètres.`
            : language === "es-ES"
            ? `Navegación hacia ${destinationName} iniciada. La distancia es de ${distance} metros.`
            : `Navigation started to ${destinationName}. The distance is ${distance} meters.`
        );
      }
    } catch (error) {
      console.error(
        "Navigation error:",
        error
      );

      setRouteInfo(
        language === "ta-IN"
          ? "Navigation-ல problem வந்திருக்கு. மறுபடியும் try பண்ணுங்க."
          : language === "hi-IN"
          ? "Navigation में problem आ गई। फिर से try करें।"
          : language === "fr-FR"
          ? "Un problème est survenu avec la navigation. Réessayez."
          : language === "es-ES"
          ? "Hubo un problema con la navegación. Inténtalo de nuevo."
          : "Navigation service error. Please try again."
      );

      speak(
        language === "ta-IN"
          ? "Navigation-ல problem வந்திருக்கு. மறுபடியும் try பண்ணுங்க."
          : language === "hi-IN"
          ? "Navigation में problem आ गई। फिर से try करें।"
          : language === "fr-FR"
          ? "Un problème est survenu avec la navigation. Réessayez."
          : language === "es-ES"
          ? "Hubo un problema con la navegación. Inténtalo de nuevo."
          : "There was a problem with navigation."
      );
    }
  };

  // ----------------------------------------
  // STOP NAVIGATION
  // ----------------------------------------

  const stopNavigation = () => {
    setNavigationOn(false);
    setCurrentInstruction("");

    setRouteInfo(
      language === "ta-IN"
        ? "Navigation நிறுத்தப்பட்டது."
        : language === "hi-IN"
        ? "Navigation बंद कर दिया गया है।"
        : language === "fr-FR"
        ? "Navigation arrêtée."
        : language === "es-ES"
        ? "Navegación detenida."
        : "Navigation stopped."
    );

    navigationStepsRef.current = [];
    nextStepRef.current = 1;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    speak(
      language === "ta-IN"
        ? "Navigation நிறுத்திட்டேன்."
        : language === "hi-IN"
        ? "Navigation बंद कर दिया।"
        : language === "fr-FR"
        ? "Navigation arrêtée."
        : language === "es-ES"
        ? "Navegación detenida."
        : "Navigation stopped."
    );
  };

  // ----------------------------------------
  // NAVIGATION TRACKING
  // ----------------------------------------

  useEffect(() => {
    if (
      !navigationOn ||
      !location
    ) {
      return;
    }

    const steps =
      navigationStepsRef.current;

    if (
      !steps ||
      steps.length === 0
    ) {
      return;
    }

    const currentIndex =
      nextStepRef.current;

    if (
      currentIndex >= steps.length
    ) {
      return;
    }

    const currentStep =
      steps[currentIndex];

    if (
      !currentStep ||
      !currentStep.location
    ) {
      return;
    }

    const distanceToStep =
      calculateDistance(
        location.lat,
        location.lon,
        currentStep.location.lat,
        currentStep.location.lon
      );

    setCurrentInstruction(
      `${currentStep.instruction} in approximately ${Math.round(
        distanceToStep
      )} meters`
    );

    if (
      distanceToStep <= 40
    ) {
      if (
        currentStep.instruction !==
        lastNavigationVoiceRef.current
      ) {
        if (language === "ta-IN") {
          speak(
            `${currentStep.instruction} இப்போ.`
          );
        } else if (
          language === "hi-IN"
        ) {
          speak(
            `${currentStep.instruction} अभी।`
          );
        } else if (
          language === "fr-FR"
        ) {
          speak(
            `${currentStep.instruction} maintenant.`
          );
        } else if (
          language === "es-ES"
        ) {
          speak(
            `${currentStep.instruction} ahora.`
          );
        } else {
          speak(
            `${currentStep.instruction} now.`
          );
        }

        lastNavigationVoiceRef.current =
          currentStep.instruction;
      }

      nextStepRef.current =
        currentIndex + 1;

      if (
        currentStep.type ===
          "arrive" ||
        currentIndex ===
          steps.length - 1
      ) {
        setTimeout(() => {
          speak(
            language === "ta-IN"
              ? "நீங்க destination-க்கு வந்துட்டீங்க."
              : language === "hi-IN"
              ? "आप destination पर पहुंच गए हैं।"
              : language === "fr-FR"
              ? "Vous êtes arrivé à destination."
              : language === "es-ES"
              ? "Has llegado a tu destino."
              : "You have arrived at your destination."
          );

          setCurrentInstruction(
            language === "ta-IN"
              ? "🏁 Destination வந்துட்டீங்க"
              : language === "hi-IN"
              ? "🏁 आप पहुंच गए"
              : language === "fr-FR"
              ? "🏁 Vous êtes arrivé"
              : language === "es-ES"
              ? "🏁 Has llegado"
              : "🏁 You have arrived"
          );

          setNavigationOn(false);
        }, 1200);
      }
    }
  }, [
    location,
    navigationOn,
    language,
  ]);

  // ----------------------------------------
  // OBJECT NAME TRANSLATION
  // ----------------------------------------

  const OBJECT_NAMES = {
    "ta-IN": {
      person: "ஒரு நபர்",
      car: "ஒரு கார்",
      bicycle: "ஒரு சைக்கிள்",
      motorcycle: "ஒரு பைக்",
      bus: "ஒரு பேருந்து",
      truck: "ஒரு லாரி",
      "traffic light": "ஒரு போக்குவரத்து சிக்னல்",
      stop: "ஒரு ஸ்டாப் சைன்",
      bench: "ஒரு பெஞ்ச்",
      chair: "ஒரு நாற்காலி",
      bottle: "ஒரு பாட்டில்",
      cup: "ஒரு கப்",
      backpack: "ஒரு பை",
      umbrella: "ஒரு குடை",
      handbag: "ஒரு கைப்பை",
      suitcase: "ஒரு சூட்கேஸ்",
      laptop: "ஒரு லேப்டாப்",
      phone: "ஒரு போன்",
      cellphone: "ஒரு செல்போன்",
      book: "ஒரு புத்தகம்",
      dog: "ஒரு நாய்",
      cat: "ஒரு பூனை",
      horse: "ஒரு குதிரை",
      bus: "ஒரு பேருந்து",
      train: "ஒரு ரயில்",
      "fire hydrant": "ஒரு ஃபயர் ஹைட்ரன்ட்",
    },
    "hi-IN": {
      person: "एक व्यक्ति",
      car: "एक कार",
      bicycle: "एक साइकिल",
      motorcycle: "एक बाइक",
      bus: "एक बस",
      truck: "एक ट्रक",
      "traffic light": "एक ट्रैफिक लाइट",
      stop: "एक स्टॉप साइन",
      bench: "एक बेंच",
      chair: "एक कुर्सी",
      bottle: "एक बोतल",
      cup: "एक कप",
      backpack: "एक बैग",
      umbrella: "एक छाता",
      handbag: "एक हैंडबैग",
      suitcase: "एक सूटकेस",
      laptop: "एक लैपटॉप",
      phone: "एक फोन",
      cellphone: "एक फोन",
      book: "एक किताब",
      dog: "एक कुत्ता",
      cat: "एक बिल्ली",
      horse: "एक घोड़ा",
      train: "एक ट्रेन",
    },
    "fr-FR": {
      person: "une personne",
      car: "une voiture",
      bicycle: "un vélo",
      motorcycle: "une moto",
      bus: "un bus",
      truck: "un camion",
      "traffic light": "un feu rouge",
      stop: "un panneau stop",
      bench: "un banc",
      chair: "une chaise",
      bottle: "une bouteille",
      cup: "une tasse",
      backpack: "un sac à dos",
      umbrella: "un parapluie",
      handbag: "un sac à main",
      suitcase: "une valise",
      laptop: "un ordinateur portable",
      phone: "un téléphone",
      cellphone: "un téléphone",
      book: "un livre",
      dog: "un chien",
      cat: "un chat",
      horse: "un cheval",
      train: "un train",
    },
    "es-ES": {
      person: "una persona",
      car: "un coche",
      bicycle: "una bicicleta",
      motorcycle: "una moto",
      bus: "un autobús",
      truck: "un camión",
      "traffic light": "un semáforo",
      stop: "una señal de stop",
      bench: "un banco",
      chair: "una silla",
      bottle: "una botella",
      cup: "una taza",
      backpack: "una mochila",
      umbrella: "un paraguas",
      handbag: "un bolso",
      suitcase: "una maleta",
      laptop: "un portátil",
      phone: "un teléfono",
      cellphone: "un teléfono",
      book: "un libro",
      dog: "un perro",
      cat: "un gato",
      horse: "un caballo",
      train: "un tren",
    },
  };

  const getSpokenObjectName = (name) => {
    const cleanName = String(name || "").trim().toLowerCase();
    return (
      OBJECT_NAMES[language]?.[cleanName] ||
      cleanName
    );
  };

  // ----------------------------------------
  // OBJECT DETECTION
  // ----------------------------------------

  useEffect(() => {
    if (!cameraOn) {
      return;
    }

    const detect = async () => {
      const video =
        videoRef.current;

      const canvas =
        canvasRef.current;

      if (
        !video ||
        !canvas ||
        video.readyState < 2
      ) {
        return;
      }

      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            return;
          }

          const formData =
            new FormData();

          formData.append(
            "image",
            blob,
            "camera.jpg"
          );

          try {
            const response =
              await fetch(
                "http://127.0.0.1:5000/detect",
                {
                  method: "POST",
                  body: formData,
                }
              );

            if (!response.ok) {
              throw new Error(
                "Backend detection error"
              );
            }

            const data =
              await response.json();

            const detected =
              data.objects || [];

            setObjects(detected);

            if (
              detected.length > 0
            ) {
              const first =
                detected[0];

              let directionText = "";

              if (
                first.direction ===
                "Left"
              ) {
                directionText =
                  language === "ta-IN"
                    ? "உங்க இடப்பக்கம்"
                    : language === "hi-IN"
                    ? "आपके बाईं तरफ"
                    : language === "fr-FR"
                    ? "à votre gauche"
                    : language === "es-ES"
                    ? "a tu izquierda"
                    : "on your left";
              } else if (
                first.direction ===
                "Right"
              ) {
                directionText =
                  language === "ta-IN"
                    ? "உங்க வலப்பக்கம்"
                    : language === "hi-IN"
                    ? "आपके दाईं तरफ"
                    : language === "fr-FR"
                    ? "à votre droite"
                    : language === "es-ES"
                    ? "a tu derecha"
                    : "on your right";
              } else {
                directionText =
                  language === "ta-IN"
                    ? "உங்க முன்னாடி"
                    : language === "hi-IN"
                    ? "आपके सामने"
                    : language === "fr-FR"
                    ? "devant vous"
                    : language === "es-ES"
                    ? "delante de ti"
                    : "in front of you";
              }

              let message = "";

              if (
                language === "ta-IN"
              ) {
                message =
                  `${getSpokenObjectName(first.name)} ${directionText}`;

                if (first.distance) {
                  message +=
                    `. தூரம் ${first.distance}`;
                }

                message += ".";
              } else if (
                language === "hi-IN"
              ) {
                message =
                  `${getSpokenObjectName(first.name)} ${directionText}`;

                if (first.distance) {
                  message +=
                    `. दूरी ${first.distance}`;
                }

                message += "।";
              } else if (
                language === "fr-FR"
              ) {
                message =
                  `${getSpokenObjectName(first.name)} ${directionText}`;

                if (first.distance) {
                  message +=
                    `. Distance ${first.distance}`;
                }

                message += ".";
              } else if (
                language === "es-ES"
              ) {
                message =
                  `${getSpokenObjectName(first.name)} ${directionText}`;

                if (first.distance) {
                  message +=
                    `. Distancia ${first.distance}`;
                }

                message += ".";
              } else {
                message =
                  `${getSpokenObjectName(first.name)} ${directionText}`;

                if (first.distance) {
                  message +=
                    `. ${first.distance}`;
                }

                message += ".";
              }

              const now =
                Date.now();

              if (
                message !== lastObjectVoiceRef.current ||
                now - lastObjectVoiceTimeRef.current > 5000
              ) {
                speak(message);

                lastObjectVoiceRef.current =
                  message;

                lastObjectVoiceTimeRef.current =
                  now;
              }
            }
          } catch (error) {
            console.error(error);

            setStatus(
              "Backend Not Connected"
            );
          }
        },
        "image/jpeg",
        0.7
      );
    };

    const interval =
      setInterval(
        detect,
        1500
      );

    return () => {
      clearInterval(interval);
    };
  }, [cameraOn, language]);

  // ----------------------------------------
  // CLEANUP
  // ----------------------------------------

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }

      if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    };
  }, []);

  // ----------------------------------------
  // UI
  // ----------------------------------------

  return (
    <div className="app">

      <header>
        <h1>
          AI Vision Navigation Guide
        </h1>

        <p>
          AI-Powered Object Detection
          and Voice Navigation
        </p>
      </header>

      <main>

        {/* CAMERA */}

        <section className="card">

          <h2>
            📷 Live AI Vision
          </h2>

          <div className="camera-container">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            {cameraOn &&
              objects.map(
                (obj, index) => {

                  if (!obj.box) {
                    return null;
                  }

                  const videoWidth =
                    videoRef.current
                      ?.videoWidth || 640;

                  const videoHeight =
                    videoRef.current
                      ?.videoHeight || 480;

                  const left =
                    (obj.box.x1 /
                      videoWidth) *
                    100;

                  const top =
                    (obj.box.y1 /
                      videoHeight) *
                    100;

                  const width =
                    ((obj.box.x2 -
                      obj.box.x1) /
                      videoWidth) *
                    100;

                  const height =
                    ((obj.box.y2 -
                      obj.box.y1) /
                      videoHeight) *
                    100;

                  return (
                    <div
                      key={index}
                      className="bounding-box"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                    >
                      <div className="box-label">
                        {obj.name}{" "}
                        {Math.round(
                          obj.confidence *
                            100
                        )}
                        %
                      </div>
                    </div>
                  );
                }
              )}

            {!cameraOn && (
              <div className="camera-off">
                <div>📷</div>
                <p>
                  Camera Off
                </p>
              </div>
            )}

          </div>

          <canvas
            ref={canvasRef}
            style={{
              display: "none",
            }}
          />

          {!cameraOn ? (
            <button
              onClick={startCamera}
            >
              Start Camera
            </button>
          ) : (
            <button
              className="stop"
              onClick={stopCamera}
            >
              Stop Camera
            </button>
          )}

          <p>
            Status: {status}
          </p>

        </section>

        {/* NAVIGATION */}

        <section className="card">

          <h2>
            🗺️ AI Voice Navigation
          </h2>

          <label>
            Voice Language
          </label>

          <select
            value={language}
            onChange={(e) => {
              if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
              setLanguage(
                e.target.value
              );
            }}
          >
            <option value="en-US">
              🇬🇧 English
            </option>

            <option value="ta-IN">
              🇮🇳 தமிழ்
            </option>

            <option value="hi-IN">
              🇮🇳 हिन्दी
            </option>

            <option value="fr-FR">
              🇫🇷 Français
            </option>

            <option value="es-ES">
              🇪🇸 Español
            </option>
          </select>

          <button
            onClick={
              getCurrentLocation
            }
          >
            📍 Get Current Location
          </button>

          {location && (
            <p>
              📍 GPS:{" "}
              {location.lat.toFixed(5)}
              ,{" "}
              {location.lon.toFixed(5)}
            </p>
          )}

          <input
            type="text"
            placeholder="Enter destination..."
            value={destination}
            onChange={(e) =>
              setDestination(
                e.target.value
              )
            }
          />

          {!navigationOn ? (
            <button
              onClick={
                startNavigation
              }
            >
              🎯 Start Navigation
            </button>
          ) : (
            <button
              className="stop"
              onClick={
                stopNavigation
              }
            >
              🛑 Stop Navigation
            </button>
          )}

          <div className="route-info">

            <strong>
              Navigation Status
            </strong>

            <p>
              {routeInfo ||
                "No navigation started."}
            </p>

            {navigationOn && (
              <p>
                🟢 Navigation Active
              </p>
            )}

            {currentInstruction && (
              <div>

                <strong>
                  🧭 Next Instruction
                </strong>

                <p>
                  {currentInstruction}
                </p>

              </div>
            )}

          </div>

          <hr />

          <h2>
            🤖 Detected Objects
          </h2>

          {objects.length === 0 ? (
            <p>
              No objects detected
            </p>
          ) : (
            objects.map(
              (obj, index) => (
                <div
                  className="object"
                  key={index}
                >

                  <div>

                    <strong>
                      {obj.name}
                    </strong>

                    <p>
                      📍{" "}
                      {obj.direction}
                    </p>

                    <p>
                      📏{" "}
                      {obj.distance}
                    </p>

                  </div>

                  <span>
                    {Math.round(
                      obj.confidence *
                        100
                    )}
                    %
                  </span>

                </div>
              )
            )
          )}

          <p
            style={{
              fontSize: "12px",
            }}
          >
            Map data © OpenStreetMap
            contributors
          </p>

        </section>

      </main>

    </div>
  );
}

export default App;