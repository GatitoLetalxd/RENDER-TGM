import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Grid,
} from '@mui/material';
import { motion } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import HistoryIcon from '@mui/icons-material/History';
import api from '../config/api';

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
        position: 'fixed',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #2196f3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
        zIndex: 0,
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
        position: 'fixed',
        bottom: '10%',
        right: '10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #21CBF3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
        zIndex: 0,
      }}
    />
  </>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData && userData.nombre) {
          setUserName(userData.nombre);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // If there's an error parsing the user data, remove it and fetch fresh data
        localStorage.removeItem('user');
      }
    }

    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/profile');
        if (response.data && response.data.nombre) {
          setUserName(response.data.nombre);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        // If we can't fetch user data and have no valid stored data, redirect to login
        if (!user) {
          navigate('/login');
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <BackgroundShapes />

      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #2196f3, #21CBF3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            RENDER-TGM
          </Typography>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 2 }}
          >
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              sx: {
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                color: 'white',
                '& .MuiMenuItem-root': {
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              },
            }}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <PersonIcon sx={{ mr: 1, color: '#2196f3' }} />
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={() => navigate('/my-images')}>
              <ImageIcon sx={{ mr: 1, color: '#2196f3' }} />
              Mis Imágenes
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, color: '#ff5252' }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              color: 'white',
              textAlign: 'center',
              mb: 4,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              fontWeight: 500,
            }}
          >
            Bienvenido, {userName}
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box
                    sx={{
                      mt: 2,
                      p: 4,
                      border: '2px dashed rgba(255, 255, 255, 0.2)',
                      borderRadius: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#2196f3',
                        background: 'rgba(33, 150, 243, 0.1)',
                      },
                    }}
                    onClick={() => navigate('/my-images')}
                  >
                    <ImageIcon 
                      sx={{ 
                        fontSize: 64, 
                        color: '#2196f3',
                        mb: 2,
                      }} 
                    />
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ color: 'white' }}
                    >
                      Gestionar Mis Imágenes
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        mb: 2,
                      }}
                    >
                      Sube, visualiza y administra tus imágenes
                    </Typography>
                    <Button
                      component={motion.button}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      variant="contained"
                      sx={{
                        background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                        color: 'white',
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        py: 1.5,
                        px: 4,
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      }}
                    >
                      Ir a Mis Imágenes
                    </Button>
                  </Box>
                </motion.div>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                    onClick={() => navigate('/my-images')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ImageIcon sx={{ color: '#2196f3', mr: 1 }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        Mis Imágenes
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ color: '#2196f3' }}>
                      Ver Todas
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <VideoLibraryIcon sx={{ color: '#2196f3', mr: 1 }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        Videos Procesados
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ color: '#2196f3' }}>
                      0
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <HistoryIcon sx={{ color: '#2196f3', mr: 1 }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        Historial
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        textAlign: 'center',
                        fontStyle: 'italic',
                      }}
                    >
                      No hay actividad reciente
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Dashboard; 