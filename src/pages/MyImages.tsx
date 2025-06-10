import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CircularProgress,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Paper,
  Tooltip,
  Stack,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CompareIcon from '@mui/icons-material/Compare';
import api from '../config/api';

interface ImageData {
  id_imagen: number;
  nombre_archivo: string;
  ruta_archivo: string;
  fecha_subida: string;
  url: string;
  estado: string;
  procesada: boolean;
  url_procesada?: string;
  fecha_procesamiento?: string;
}

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
        background: 'linear-gradient(45deg, #1976d2 30%, #90caf9 90%)',
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
        background: 'linear-gradient(45deg, #90caf9 30%, #42a5f5 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
        zIndex: 0,
      }}
    />
  </>
);

const MyImages = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState<{original: string; processed?: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingImages, setProcessingImages] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await api.get('/images');
      if (response.data) {
        setImages(response.data);
        setError('');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar las imágenes');
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecciona solo archivos de imagen');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Las imágenes no deben superar los 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/images/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
      });

        if (response.data) {
          setImages(prev => [response.data, ...prev]);
          setSuccess('Imagen subida correctamente');
          await fetchImages();
        }
      }
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setError(err.message || 'Error al subir las imágenes');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
      return;
      }

    try {
      await api.delete(`/images/${id}`);
      setImages(images.filter(img => img.id_imagen !== id));
      setSuccess('Imagen eliminada correctamente');
      setError('');
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError(err.message || 'Error al eliminar la imagen');
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImage = async (imageId: number) => {
    try {
      setProcessingImages(prev => [...prev, imageId]);
      const response = await api.post(`/images/${imageId}/process`);
      
      // Asegurar que la URL procesada sea absoluta
      const ABSOLUTE_URL = "http://localhost:5000";
      const processedUrl = response.data.url_procesada?.startsWith('http') 
        ? response.data.url_procesada 
        : ABSOLUTE_URL + response.data.url_procesada;
      
      setImages(prevImages => 
        prevImages.map(img => 
          img.id_imagen === imageId 
            ? { 
                ...img, 
                procesada: true, 
                url_procesada: processedUrl,
                fecha_procesamiento: new Date().toISOString()
              } 
            : img
        )
      );
      
      setSuccess('Imagen procesada correctamente');
    } catch (err: any) {
      console.error('Error al procesar la imagen:', err);
      setError(err.message || 'Error al procesar la imagen');
    } finally {
      setProcessingImages(prev => prev.filter(id => id !== imageId));
    }
  };

  const handleCompareImages = (original: string, processed?: string) => {
    if (processed) {
      setSelectedImage({ original, processed });
    }
  };

  // Log para depuración de IDs
  console.log('IDs de imágenes:', images.map(img => img && img.id_imagen));

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'background.default'
      }}>
        <BackgroundShapes />
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      backgroundColor: 'background.default',
      pb: 4
    }}>
      <BackgroundShapes />
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Volver">
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ 
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'primary.main' }}>
          Mis Imágenes
        </Typography>
        </Box>

        {/* Área de subida de archivos */}
        <Paper
          elevation={3}
          sx={{
            mt: 3,
            mb: 4,
            p: 3,
            textAlign: 'center',
            backgroundColor: isDragging ? 'rgba(144, 202, 249, 0.08)' : 'background.paper',
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'divider',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 1,
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(144, 202, 249, 0.08)'
            }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="primary">
            {isDragging ? 'Suelta las imágenes aquí' : 'Arrastra y suelta imágenes aquí'}
          </Typography>
          <Typography color="text.secondary">
            o haz clic para seleccionar archivos
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            Formatos soportados: JPG, PNG, GIF - Tamaño máximo: 5MB
          </Typography>
          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <CircularProgress size={24} />
      </Box>
      )}
        </Paper>

      <Grid container spacing={3}>
        {images.filter(img => img && img.id_imagen != null).map((image) => {
          const ABSOLUTE_URL = "http://localhost:5000";
          const fullUrl = image.url.startsWith('http') ? image.url : ABSOLUTE_URL + image.url;
          // También crear URL absoluta para imagen procesada
          const processedUrl = image.url_procesada 
            ? (image.url_procesada.startsWith('http') ? image.url_procesada : ABSOLUTE_URL + image.url_procesada)
            : undefined;
          
          console.log('image.url (raw):', image.url);
          console.log('image.url_procesada (raw):', image.url_procesada);
          console.log('fullUrl:', fullUrl);
          console.log('processedUrl:', processedUrl);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={image.id_imagen}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'background.paper',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
                  }
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={fullUrl}
                    alt={image.nombre_archivo}
                    sx={{ 
                      objectFit: 'cover', 
                      cursor: 'pointer',
                      backgroundColor: 'background.default'
                    }}
                    onClick={() => setSelectedImage({ original: fullUrl, processed: processedUrl })}
                  />
                  {image.procesada && processedUrl && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: '50%',
                        overflow: 'hidden',
                        borderLeft: '2px solid',
                        borderColor: 'primary.main'
              }}
            >
              <CardMedia
                component="img"
                height="200"
                        image={processedUrl}
                        alt="Imagen procesada"
                        sx={{ 
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedImage({ original: fullUrl, processed: processedUrl })}
                      />
                    </Box>
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1, bgcolor: 'background.paper' }}>
                  <Typography variant="body2" noWrap color="text.primary">
                    {image.nombre_archivo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Subida: {new Date(image.fecha_subida).toLocaleDateString()}
                </Typography>
                  {image.procesada && image.fecha_procesamiento && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Procesada: {new Date(image.fecha_procesamiento).toLocaleDateString()}
                </Typography>
                  )}
              </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 1, bgcolor: 'background.paper' }}>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Descargar original">
                <IconButton 
                        onClick={() => handleDownload(fullUrl, image.nombre_archivo)}
                        size="small"
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { 
                            color: 'primary.main',
                            transform: 'scale(1.1)'
                          }
                        }}
                >
                  <DownloadIcon />
                </IconButton>
                    </Tooltip>
                    {image.procesada && processedUrl ? (
                      <Tooltip title="Ver comparación">
                        <IconButton
                          onClick={() => handleCompareImages(fullUrl, processedUrl)}
                          size="small"
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': { 
                              color: 'info.main',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <CompareIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Procesar imagen">
                        <IconButton
                          onClick={() => handleProcessImage(image.id_imagen)}
                          disabled={processingImages.includes(image.id_imagen)}
                          size="small"
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': { 
                              color: 'success.main',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          {processingImages.includes(image.id_imagen) ? (
                            <CircularProgress size={20} />
                          ) : (
                            <AutoFixHighIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Ver imagen">
                      <IconButton 
                        onClick={() => setSelectedImage({ original: fullUrl, processed: processedUrl })}
                        size="small"
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { 
                            color: 'info.main',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <ZoomInIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                <IconButton 
                        onClick={() => handleDelete(image.id_imagen)}
                        size="small"
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { 
                            color: 'error.main',
                            transform: 'scale(1.1)'
                          }
                        }}
                >
                  <DeleteIcon />
                </IconButton>
                    </Tooltip>
                  </Stack>
              </CardActions>
            </Card>
          </Grid>
        );
        })}
      </Grid>

        {/* Diálogo para ver imagen */}
        <Dialog
          open={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          maxWidth="lg"
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper',
              backgroundImage: 'none',
              maxWidth: '90vw'
            }
          }}
        >
          <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>
            {selectedImage && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Box sx={{ flex: 1, maxWidth: '50%' }}>
                    <Typography variant="subtitle1" align="center" gutterBottom>
                      Imagen Original
          </Typography>
                    <img
                      src={selectedImage.original}
                      alt="Original"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </Box>
                  {selectedImage.processed && (
                    <Box sx={{ flex: 1, maxWidth: '50%' }}>
                      <Typography variant="subtitle1" align="center" gutterBottom>
                        Imagen Procesada
          </Typography>
                      <img
                        src={selectedImage.processed}
                        alt="Procesada"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', p: 1, bgcolor: 'background.paper' }}>
          <Button
              onClick={() => setSelectedImage(null)} 
            variant="contained"
              color="primary"
          >
              Cerrar
          </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbars para mensajes */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Container>
        </Box>
  );
};

export default MyImages; 