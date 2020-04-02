import React, { Component } from 'react'
import './App.css'
import Grid from "./components/Grid";
import NodeLegend from "./components/NodeLegend";
import Figure from "./components/Figure";

type Props = {
}

type State = {
  spoilersVisible: boolean,
}

class App extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      spoilersVisible: false,
    }
  }

  renderMainPost() {


    // noinspection HtmlRequiredAltAttribute
    return (
      <div className="post-content">
        <Figure>
          <Grid gridRows={316}
                gridCols={316}
                // highlight="transmissionRate"
                hospitalCapacityPct={0.05}
                nodeSize={5}
                nug={5}
                randomSeed={100}
                showAliveFraction={true}
                showAllControls={true}
                //showDaysPerStateControls={true}
                showDeaths={true}
                showTransmissionProbabilitySlider={true}
                showChanceOfIsolationAfterSymptomsSlider={true}
                // showPersonHoursSlider={true}
                // showTransmissionProbabilitySlider={true}
                // showTravelRadiusSlider={true}
                speed={1}
          />
        </Figure>

      </div>
    );
  }

  // renderSubscribeForm() {
  //   return (
  //     <form method="post" action="https://meltingasphalt.us8.list-manage.com/subscribe/post?u=0bc9d741e167733d20c520ea6&amp;id=57ebd9b4a6" id="mc4wp-form-1" className="form mc4wp-form"><input type="email" id="mc4wp_email" name="EMAIL" placeholder="Enter your email" required />
  //       <input type="submit" value="Subscribe" />
  //       <textarea name="_mc4wp_required_but_not_really" style={{display: "none"}}/><input type="hidden" name="_mc4wp_form_submit" value="1" /><input type="hidden" name="_mc4wp_form_instance" value="1" /><input type="hidden" name="_mc4wp_form_nonce" value="8a45344b67" />
  //     </form>
  //   )
  // }

  renderEndOfPostDivider(showTimestamp: boolean) {
    let timestamp = "";
    let divider = <span>——</span>;
    if (showTimestamp) {
      timestamp = "Originally published March 16, 2020.";
      divider = <img src="https://meltingasphalt.com/wp-content/themes/responsive/core/images/flourish.svg" width={50} alt="——" />;
    }

    return (
      <div style={{textAlign: "center"}}>
        <div className="end-of-post-divider">
          {divider}
        </div>
        <div className="signature-line">
          {timestamp}
        </div>
      </div>
    );
  }

  // renderHeader() {
  //   return (
  //       <div id="header">
  //         <div id="logo" className="branded">
  //           <span className="site-name">
  //             <a href="https://meltingasphalt.com/" title="Melting Asphalt" rel="home">
  //               <img id="nav-logo" src="https://meltingasphalt.com/wp-content/themes/responsive/core/images/ma.svg" />
  //                                       &nbsp;&nbsp;Melting Asphalt
  //             </a>
  //           </span>
  //         </div>
  //       </div>
  //   );
  // }

  render() {
    return (
      <div className="main-container">
        <div className="content">
          {this.renderMainPost()}
        </div>
        <div className="blank-r"/>
        <div className="footer"/>
      </div>
    );
  }
}

export default App
