import { HashRouter as Router, Link, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import ConsusePage from './consuse';
import FirstQ from './firstQ';
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
        </div>
        <Content>
          <Switch>
            <Route path="/first">
              <FirstQ />
            </Route>
            <Route path="/map">
              <SecondQ />
            </Route>
            <Redirect from='/' to='/first' />
          </Switch>
        </Content>
      </Router>
    </div>
  );
}

export default App;
