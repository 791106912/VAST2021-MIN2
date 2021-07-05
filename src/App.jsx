import { HashRouter as Router, Link, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import ConsumerGraph from './components/consumerGraph';
import Map3D from './components/map';
import Cal from './dataCal';
import SecondQ from './secondQ';

function Content({children}) {
  return <div>
    {children}
  </div>
}

function App() {
  return (
    <div className="App">
      <Router>
        {/* <ConsusePage /> */}
        <div className='nav'>
            <Link to="/first">first Q</Link>
            <Link to="/map">map</Link>
            <Link to="/cal">cal</Link>
            <Link to="/map2">3D Map</Link>
        </div>
        <Content>
          <Switch>
            <Route path="/first">
              <ConsumerGraph />
            </Route>
            <Route path="/map">
              <SecondQ />
            </Route>
            <Route path="/cal">
              <Cal />
            </Route>
            <Route path="/map2">
              <Map3D />
            </Route>
            <Redirect from='/' to='/first' />
          </Switch>
        </Content>
      </Router>
    </div>
  );
}

export default App;
