import { Box, Button, Container, Typography, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import HighQualityIcon from '@mui/icons-material/HighQuality';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SpeedIcon from '@mui/icons-material/Speed';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

// Importa tus imágenes aquí
// Ejemplo: import imagen1 from '../assets/images/imagen1.jpg';

const images = [
  // Reemplaza estas URLs con las rutas de tus imágenes locales
  '/src/assets/images/imagen1.jpg',
  '/src/assets/images/imagen2.jpg',
  '/src/assets/images/imagen3.jpg',
];

const secondaryImages = [
  '/src/assets/images/imagen4.jpg',
  '/src/assets/images/imagen5.jpg',
  '/src/assets/images/imagen6.jpg',
];

// Componente para las figuras de fondo
const BackgroundShapes = () => (
  <>
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }}
      sx={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #2196f3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
      }}
    />
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.3, 1],
        rotate: [360, 180, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
      sx={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #21CBF3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
      }}
    />
  </>
);

// Componente para el segundo carrusel
const SecondCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setActiveIndex((prevIndex) => (prevIndex + newDirection + secondaryImages.length) % secondaryImages.length);
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      height: '60vh',
      width: '100%',
      overflow: 'hidden',
      bgcolor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: '80%',
              height: '80%',
              position: 'relative',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }}
          >
            <Box
              component="img"
              src={secondaryImages[activeIndex]}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.8)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 3,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <Typography variant="h5" sx={{ mb: 1, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                Imagen {activeIndex + 1}
              </Typography>
              <Typography variant="body1" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                Descripción de la imagen {activeIndex + 1}
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>

      <Box
        component={motion.div}
        whileHover={{ opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => paginate(-1)}
        sx={{
          position: 'absolute',
          left: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          cursor: 'pointer',
          opacity: 0.6,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KeyboardArrowLeftIcon sx={{ fontSize: 40, color: 'white' }} />
      </Box>

      <Box
        component={motion.div}
        whileHover={{ opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => paginate(1)}
        sx={{
          position: 'absolute',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          cursor: 'pointer',
          opacity: 0.6,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KeyboardArrowRightIcon sx={{ fontSize: 40, color: 'white' }} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          zIndex: 2,
        }}
      >
        {secondaryImages.map((_, index) => (
          <Box
            key={index}
            component={motion.div}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setDirection(index > activeIndex ? 1 : -1);
              setActiveIndex(index);
            }}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: index === activeIndex ? '#2196f3' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const containerRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [secondaryImageIndex, setSecondaryImageIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondaryImageIndex((prevIndex) => (prevIndex + 1) % secondaryImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <BackgroundShapes />

      {/* Hero Section con Carrusel */}
      <Box
        sx={{
          height: '98.5vh',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Carrusel de Imágenes */}
        <motion.div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            y,
            opacity,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { 
                  duration: 1,
                  ease: "easeOut"
                }
              }}
              exit={{ 
                opacity: 0,
                scale: 0.95,
                transition: { 
                  duration: 0.5,
                  ease: "easeIn"
                }
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundImage: `url(${images[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.4)',
              }}
            />
          </AnimatePresence>
        </motion.div>

        {/* Contenido sobre el carrusel */}
        <Container
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography 
              variant="h1" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: '#fff',
                textAlign: 'center',
                mb: 4,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontSize: { xs: '3rem', sm: '4rem', md: '5rem' }
              }}
            >
              RENDER-TGM
            </Typography>
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom 
              sx={{ 
                color: '#fff',
                textAlign: 'center',
                mb: 6,
                maxWidth: '800px',
                mx: 'auto',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }}
            >
              Transformamos tus imágenes con inteligencia artificial
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                  color: 'white',
                  px: 4,
                  py: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
              >
                Comenzar Ahora
              </Button>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  px: 4,
                  py: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderColor: '#21CBF3',
                    background: 'rgba(33, 203, 243, 0.1)',
                  },
                }}
              >
                Iniciar Sesión
              </Button>
            </Box>
          </motion.div>
        </Container>

        {/* Indicadores del carrusel */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '1rem',
            zIndex: 2,
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              component={motion.div}
              animate={{
                scale: currentImageIndex === index ? 1.2 : 1,
                opacity: currentImageIndex === index ? 1 : 0.5,
              }}
              sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </Box>
      </Box>

      {/* Segundo Carrusel */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl">
          <Typography 
            variant="h3" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              color: 'white',
              mb: 6,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              fontWeight: 500,
            }}
          >
            Nuestros Trabajos
          </Typography>
          <SecondCarousel />
        </Container>
      </Box>

      {/* Sección de Características */}
      <Container sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {[
            {
              icon: <HighQualityIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
              title: 'Alta Calidad',
              description: 'Resultados profesionales con la mejor calidad de imagen'
            },
            {
              icon: <SpeedIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
              title: 'Procesamiento Rápido',
              description: 'Obtén tus resultados en cuestión de segundos'
            },
            {
              icon: <CloudUploadIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
              title: 'Fácil de Usar',
              description: 'Interfaz intuitiva para subir y procesar tus imágenes'
            }
          ].map((feature, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {feature.icon}
                  <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'white' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Sección de Contacto */}
      <Box sx={{ py: 8, bgcolor: 'rgba(0, 0, 0, 0.2)' }}>
        <Container>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              textAlign: 'center',
              mb: 6,
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            Contáctanos
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {[
              {
                icon: <EmailIcon sx={{ fontSize: 30, color: '#2196f3' }} />,
                title: 'Email',
                content: 'rmontufarm@unamad.edu.pe'
              },
              {
                icon: <PhoneIcon sx={{ fontSize: 30, color: '#2196f3' }} />,
                title: 'Teléfono',
                content: '983126035'
              },
              {
                icon: <LocationOnIcon sx={{ fontSize: 30, color: '#2196f3' }} />,
                title: 'Ubicación',
                content: 'Madre de Dios, Perú'
              }
            ].map((contact, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {contact.icon}
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'white' }}>
                      {contact.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {contact.content}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 