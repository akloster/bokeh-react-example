import React from 'react';
import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import { Button, AppBar, Toolbar, IconButton, Typography,
  Paper, List, ListItem
    } from '@material-ui/core';
import {Menu as MenuIcon} from '@material-ui/icons';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link as RouterLink
} from "react-router-dom";
import {DemoSimple} from "./components/DemoSimple";
import { DemoUpdating } from './components/DemoUpdating';
import { FastAPISimpleDemo } from './components/FastAPISimple';
import { FastAPIWS } from './components/FastAPIWS';

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    width: "100%",
  },
  leftPanel: {
    width: 360,
    backgroundColor: theme.palette.background.paper,
    margin: "6px",
    flex: "none",
  },
  mainPanel:{
    width: "100%",
    margin: "6px",
  }
}));
function ListItemLink(props:any) {
  return <ListItem button component={RouterLink} {...props} />;
}

function App() {
  const classes = useStyles();
  return <div>
   <AppBar position="static">
   <Toolbar>
    <IconButton edge="start" className="" color="inherit" aria-label="menu">
      <MenuIcon />
    </IconButton>
    <Typography variant="h6" className="">
      Using Bokeh with React
    </Typography>
  </Toolbar>
  </AppBar>
  <Router>
  <div className={classes.root}>
    <Paper elevation={3} className={classes.leftPanel}>
      <List>
        <ListItemLink to="/simple">
          Just BokehJS
        </ListItemLink>
        <ListItemLink to="/bokehjs-updating">
          Updating in BokehJS
        </ListItemLink>
        <ListItemLink to="/fastapi">
          FastAPI to BokehJS
        </ListItemLink>
        <ListItemLink to="/fastapi-ws">
          FastAPI with websocket
        </ListItemLink>
      </List>
    </Paper>
    <Paper className={classes.mainPanel}>
      <Switch>
        <Route path="/simple">
          <DemoSimple/>
        </Route>
        <Route path="/bokehjs-updating">
          <DemoUpdating/>
        </Route>
        <Route path="/fastapi">
          <FastAPISimpleDemo/>
        </Route>
        <Route path="/fastapi-ws">
          <FastAPIWS />
        </Route>
        <Route path="/">
          <p>This is an application to demonstrate usage of Bokeh and BokehJS with
            React, optionally also with FastAPI.
          </p>
        </Route>
      </Switch>
    </Paper>
  </div>
  </Router>
  </div>
}

export default App;
