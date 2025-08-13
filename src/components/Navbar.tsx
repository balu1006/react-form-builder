import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Form Builder
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={Link}
            to="/create"
            variant={isActive('/create') ? 'outlined' : 'text'}
            sx={{ mr: 1 }}
          >
            Create Form
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/preview"
            variant={isActive('/preview') ? 'outlined' : 'text'}
            sx={{ mr: 1 }}
          >
            Preview
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/myforms"
            variant={isActive('/myforms') ? 'outlined' : 'text'}
          >
            My Forms
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
