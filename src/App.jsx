import { HashRouter as Router, Link, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import ConsumerGraph from './components/consumerGraph';
import Map3D from './components/map';
import Cal from './dataCal';
import System from './page/system';
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
        <div className='nav'>
            <Link to="/first">first Q</Link>
            <Link to="/map">map</Link>
            <Link to="/cal">cal</Link>
            <Link to="/map2">3D Map</Link>
            <Link to="/system">System</Link>
        </div>
        <Content>
          <Switch>
            <Router path='/system'>
              <System />
            </Router>
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
              <div style={{height: '800px'}}>
                <Map3D />
              </div>
            </Route>
            <Redirect from='/' to='/first' />
          </Switch>
        </Content>
      </Router>
    </div>
  );
}

export default App;
