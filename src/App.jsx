import { HashRouter as Router, Link, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import ConsumerGraph from './components/consumerGraph';
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
            <Redirect from='/' to='/first' />
          </Switch>
        </Content>
      </Router>
    </div>
  );
}

export default App;
