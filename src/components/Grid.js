// @flow

import React, {Component} from 'react'
import '../App.css';
import Utils from "../Utils";
import Slider from '@material-ui/lab/Slider';
import {RNG} from "../RNG";
import Interval from "./Interval";
import {GridNode} from "./Models";
import Colors from "../Colors";
import Waypoint from "react-waypoint";
import WidgetButton from "./WidgetButton";
import Plot from "./Plot"
import Constants from "./Constants";

import PlotLib from 'react-plotly.js';
import Translation from "../translation/rus";
import NodeLegend from "./NodeLegend";


type Props = {
  randomSeed: number,

  // Network
  addCities: boolean,
  addLinkedNodes: boolean,
  gridCols?: number,
  gridRows?: number,
  populationSize: number,

  // Simulation parameters
  daysIncubating?: number,
  daysSymptomatic?: number,
  deathRate?: number,
  decreaseInEncountersAfterSymptoms?: number,
  chanceOfIsolationAfterSymptoms?: number,
  hospitalCapacityPct?: number,
  immunityFraction?: number,
  maxActiveNodes?: number,
  maxIterations?: number,
  personHours?: number,
  transmissionProbability?: number,
  travelRadius?: number,

  // Rendering parameters
  drawNodeOutlines?: boolean,
  nodeSize?: number,
  speed?: number,

  // Controls
  highlight?: string,
  immunitySliderName?: string,
  maxTransmissionRate?: number,
  showAliveFraction?: boolean,
  showAllControls?: boolean,
  showDaysPerStateControls?: boolean,
  showDeaths?: boolean,
  showDeathRateSlider?: boolean,
  showDecreaseInEncountersAfterSymptomsSlider?: boolean,
  showChanceOfIsolationAfterSymptomsSlider?: boolean,
  showDegreeSlider?: boolean,
  showHospitalCapacitySlider?: boolean,
  showImmunityFractionSlider?: boolean,
  showInteractions?: boolean,
  showPersonHoursSlider?: boolean,
  showPlaybackControls?: boolean,
  showProTip?: boolean,
  showSimulationButtons?: boolean,
  showSpeedControls?: boolean,
  showTransmissionProbabilitySlider?: boolean,
  showTravelRadiusSlider?: boolean,
}

type State = {
  numActiveNodes: number,
  playing: boolean,
  visible: boolean,

  // Network

  // Simulation
  daysIncubating: number,
  daysSymptomatic: number,
  deathRate: number,
  decreaseInEncountersAfterSymptoms: number,
  chanceOfIsolationAfterSymptoms: number,
  hospitalCapacityPct: number,
  immunityFraction: number,
  longDistaceNetworkActive: boolean,
  maxIterations: number,
  personHours: number,
  transmissionProbability: number,
  travelRadius: number,

  // Rendering
  centerNodeNeighborsToDisplay: GridNode[];
  drawNodeOutlines: boolean,
  gridWidth: number,
  hospitalCapacitySliderHighlighted: boolean,
  nodeSize: number,
  speed: number,  // between 0 and 1

  // Outcomes
  capacityPerDay: number[],
  deadPerDay: number[],
  infectedPerDay: number[],
  recoveredPerDay: number[],
  healthyPerDay: number[],
  isolatePerDay: number [],
}

export default class Grid extends Component<Props, State> {
  // noinspection DuplicatedCode
  static NEIGHBOR_CLASSES = [
      [[0, 0]],
      [[-1, 0], [1, 0], [0, -1], [0, 1]],
      [[-1, -1], [-1, 1], [1, -1], [1, 1]],
      [[-2, -2], [-2, -1], [-2, 0], [-2, 1], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [2, -1], [2, -2], [1, -2], [0, -2], [-1, -2]],
  ];

  // Set default props
  static defaultProps = {
    randomSeed: -1,

    // Network
    addCities: false,
    addLinkedNodes: false,
    gridCols: 1,
    gridRows: 1,
    populationSize: 100000,

    // Simulation parameters
    daysIncubating: 5,
    daysSymptomatic: 14,
    deathRate: 0.03,
    decreaseInEncountersAfterSymptoms: 0.0,
    chanceOfIsolationAfterSymptoms: 0.0,
    hospitalCapacityPct: -1,
    hospitalCapacitySize: 100,
    immunityFraction: 0,
    maxIterations: -1,
    nug: 20,
    personHours: 20,
    transmissionProbability: 0.35,
    travelRadius: 6,

    // Rendering parameters
    drawNodeOutlines: true,
    speed: 0.5,

    // Controls
    immunitySliderName: "Immunity",
    maxTransmissionRate: 1,
    showAliveFraction: false,
    showAllControls: false,
    showDaysPerStateControls: false,
    showDeaths: false,
    showDecreaseInEncountersAfterSymptomsSlider: false,
    showChanceOfIsolationAfterSymptomsSlider: false,
    showDeathRateSlider: false,
    showDegreeSlider: false,
    showHospitalCapacitySlider: false,
    showImmunityFractionSlider: false,
    showInteractions: true,
    showPersonHoursSlider: false,
    showPlaybackControls: true,
    showProTip: false,
    showSimulationButtons: false,
    showSpeedControls: false,
    showTransmissionProbabilitySlider: false,
    showTravelRadiusSlider: false,
  };

  grid: GridNode[][];
  rng: RNG;

  // Weird rendering parameters; don't want React trying to auto-manage these
  gridWidth: number;
  nodeSize: number;

  canvasRef: any;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.previousSimulationParams = ['foo'];

    this.previousDrawingParams = [];
    this.previousInteractionsParams = [];

    this.onTick = this.onTick.bind(this);
    this.onEnter = this.onEnter.bind(this);
    this.onLeave = this.onLeave.bind(this);

    this.initializeFromProps(this.props, true);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  updateWindowDimensions() {
    let idealWidth = this.state.gridCols * this.state.nodeSize;
    if (this.state.nodeSize >= 5) {
      idealWidth += this.state.gridCols;
    }

    let gridWidth = Math.min(idealWidth, document.documentElement.clientWidth - 40);
    let nodeSize = Math.floor(gridWidth / this.state.gridCols);

    gridWidth = nodeSize * this.state.gridCols;

    if (this.gridWidth !== gridWidth || this.nodeSize !== nodeSize) {
      this.gridWidth = gridWidth;
      this.nodeSize = nodeSize;
      this.redraw(true);
    }
  }

  componentWillReceiveProps(nextProps: Props, nextContext: any): void {
    // this.initializeFromProps(nextProps, false);
  }

  initializeFromProps(props: Props, fromConstructor: boolean) {


    let state = {
      numActiveNodes: 0,
      playing: false,
      visible: false,

      // Network
      gridCols: props.gridCols,
      gridRows: props.gridRows,
      populationSize: props.populationSize,
      nodeSize: props.nodeSize,


      // Simulation
      daysIncubating: props.daysIncubating,
      daysSymptomatic: props.daysSymptomatic,
      deathRate: props.deathRate,
      decreaseInEncountersAfterSymptoms: props.decreaseInEncountersAfterSymptoms,
      chanceOfIsolationAfterSymptoms: props.chanceOfIsolationAfterSymptoms,
      hospitalCapacityPct: props.hospitalCapacityPct,
      hospitalCapacitySize: props.hospitalCapacitySize,
      immunityFraction: props.immunityFraction,
      longDistaceNetworkActive: props.addLinkedNodes,
      maxIterations: props.maxIterations,
      personHours: props.personHours,
      transmissionProbability: props.transmissionProbability,
      travelRadius: props.travelRadius,

      // Rendering
      centerNodeNeighborsToDisplay: [],
      drawNodeOutlines: props.drawNodeOutlines,
      hospitalCapacitySliderHighlighted: false,
      speed: props.speed,

      // Outcomes
      capacityPerDay: [],
      deadPerDay: [],
      infectedPerDay: [],
      recoveredPerDay: [],
      healthyPerDay: [],
      isolatePerDay: [],
    };

    this.gridWidth = state.gridCols * state.nodeSize;
    this.nodeSize = state.nodeSize;

    let randomSeed = props.randomSeed;
    if (randomSeed === -1) {
      randomSeed = Math.floor(Math.random() * 3000000);
    }
    this.rng = new RNG(randomSeed);


    if (fromConstructor) {
      this.state = state;
    } else {
      this.setState(state);
    }
  }

  componentDidMount() {
    this.canvas = this.canvasRef.current;

    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);

    // this.regenerate();
    this.redraw(true);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  onTick() {
    if (this.state.playing && this.state.visible) {
      this.simulateStep();
      // this.simulateStep();
      // this.simulateStep();
      // this.simulateStep();
      this.redraw(true);
    }
  }

  onEnter() {
    this.setState({
      visible: true,
    });
    this.redraw(true);
  }

  onLeave() {
    this.setState({
      visible: false,
    });
  }

  static shuffleInPlace(arr, rng: RNG) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  regenerate() {
    this.generate();
    this.forceUpdate();
  }

  resetPlotVariables() {
    this.state.capacityPerDay = [];
    this.state.deadPerDay = [];
    this.state.healthyPerDay = [];
    this.state.infectedPerDay = [];
    this.state.recoveredPerDay = [];
    this.state.isolatePerDay = [];
  }

  generate(force: boolean) {
    // actually regenerate iff any of the simulation parameters have changed
    let currentSimulationParams = [
        // this.state.immunityFraction,
    ];
    if (!force && Utils.arraysEqual(this.previousSimulationParams, currentSimulationParams)) {
      // console.log('rejecting generate');
      return;
    }

    this.previousSimulationParams = currentSimulationParams;

    // console.log('Generating new network');


    if (this.state.infectedPerDay.length > 1 && this.state.infectedPerDay[this.state.infectedPerDay.length-2] !== null) {
      this.state.capacityPerDay.push(null);
      this.state.deadPerDay.push(null);
      this.state.infectedPerDay.push(null);
      this.state.recoveredPerDay.push(null);
      this.state.isolatePerDay.push(null);
      this.state.healthyPerDay.push(this.state.gridRows * this.state.gridCols -
        this.state.deadPerDay[this.state.deadPerDay.length -1] -
        this.state.infectedPerDay[this.state.infectedPerDay.length -1] -
        this.state.recoveredPerDay[this.state.recoveredPerDay.length-1]);
    }
    if (this.state.infectedPerDay.length === 0 || this.state.infectedPerDay[this.state.infectedPerDay.length-1] === null) {
      this.state.capacityPerDay.push(this.state.hospitalCapacityPct * this.props.gridRows * this.props.gridCols);
      this.state.deadPerDay.push(0);
      this.state.healthyPerDay.push(this.state.gridRows * this.state.gridCols);
      this.state.infectedPerDay.push(this.props.nug);
      this.state.recoveredPerDay.push(0);
      this.state.isolatePerDay.push(0);
    }

    this.state.centerNodeNeighborsToDisplay = [];

    let nRows = this.state.gridRows;
    let nCols = this.state.gridCols;

    // Initialize grid
    this.grid = [];
    for (let r = 0; r < nRows; r++) {
      let row = [];
      for (let c = 0; c < nCols; c++) {
        let node = new GridNode(this.rng, r, c);
        node.immune = this.rng.random() < this.state.immunityFraction;

        row.push(node);
      }
      this.grid.push(row);
    }

    // Add linked nodes
    // noinspection JSMismatchedCollectionQueryUpdate
    let linkedNodes: Set<GridNode> = new Set();
    if (this.props.addLinkedNodes) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          let r = Math.floor((nRows / 6) * (2 * i + 1));
          let c = Math.floor((nCols / 6) * (2 * j + 1));
          let node = this.grid[r][c];
          node.linked = true;
          node.setSusceptible();  // make sure it's not removed
          linkedNodes.add(node);
        }
      }
    }

    // Add cities
    if (this.props.addCities) {
      let cityCenters = [];
      cityCenters.push([Math.floor(3/4 * nRows), Math.floor(1/4 * nCols)]);
      cityCenters.push([Math.floor(1/4 * nRows), Math.floor(3/4 * nCols)]);
      for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
          for (let center of cityCenters) {
            let cr = center[0];
            let cc = center[1];
            let distance = Math.sqrt(Math.pow(cr - r, 2) + Math.pow(cc - c, 2));
            if (distance <= 16) {
              this.grid[r][c].specialDegree = 8 - Math.floor(distance/4);
            }
          }
        }
      }
    }

    // Initialize nug
    let centerR = Math.floor((nRows - 1) / 2);
    let centerC = Math.floor((nCols - 1) / 2);
    if (this.props.nug === 1) {
      if (this.state.daysIncubating === 0) {
        this.grid[centerR][centerC].setInfected();
      } else {
        this.grid[centerR][centerC].setExposed();
      }
    } else if (this.props.nug === 5) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
            continue;
          }

          this.grid[centerR+dr][centerC+dc].setExposed();
        }
      }
    } else if (this.props.nug === 20) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
            continue;
          }

          this.grid[centerR+dr][centerC+dc].setExposed();
        }
      }
    }

    this.redraw(true);
    this.setState({
      numActiveNodes: this.props.nug,
    })
  }

  simulateStep() {
    let nRows = this.state.gridRows;
    let nCols = this.state.gridCols;

    // let actualRemovedCells = 0;
    let linkedNodes: Set<GridNode> = new Set();

    // Start day
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        let node = this.grid[r][c];
          node.startDay();
          if (this.state.longDistaceNetworkActive && node.linked) {
            linkedNodes.add(node);
          }
      }
    }

    // Infect
    let centerNodeNeighborsToDisplay = [];
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        let node = this.grid[r][c];
        if (this.props.showInteractions && this.isCenterNode(r, c) && node.canInfectOthers()) {
          centerNodeNeighborsToDisplay = this.maybeInfect(node, r, c, linkedNodes);
        } else {
          this.maybeInfect(node, r, c, linkedNodes);
        }
      }
    }

    // End day
    let actualInfectedNodes = 0;
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        let node = this.grid[r][c];
        if (node.getNextState() === Constants.EXPOSED || node.getNextState() === Constants.INFECTED) {
          actualInfectedNodes++;
        }
      }
    }
    let chanceOfIsolationAfterSymptoms = this.state.chanceOfIsolationAfterSymptoms;
    if (!this.props.showChanceOfIsolationAfterSymptomsSlider) {
      chanceOfIsolationAfterSymptoms = 0;
    }
    let overCapacity = this.state.hospitalCapacityPct > -1 && actualInfectedNodes > this.state.hospitalCapacityPct * (nRows*nCols);
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        let node = this.grid[r][c];
        node.endDay(overCapacity,
            this.state.daysIncubating,
            this.state.daysSymptomatic,
            this.props.showDeaths,
            this.state.deathRate,
            chanceOfIsolationAfterSymptoms);
      }
    }
    let actualDeadNodes = 0;
    let actualRecoveredNodes = 0;
    let actualIsolateNodes = 0;
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        let node = this.grid[r][c];
        if (node.getNextState() === Constants.REMOVED) {
          actualRecoveredNodes++;
        } else if (node.getNextState() === Constants.DEAD) {
          actualDeadNodes++;
        } else if (node.isIsolating()) {
          actualIsolateNodes++;
        }
      }
    }

    let population = this.state.gridRows * this.state.gridCols;

    this.state.capacityPerDay.push(this.state.hospitalCapacityPct * population);
    this.state.deadPerDay.push(actualDeadNodes);
    this.state.healthyPerDay.push(population - ( actualRecoveredNodes + actualInfectedNodes + actualDeadNodes ));
    this.state.infectedPerDay.push(actualInfectedNodes);
    this.state.recoveredPerDay.push(actualRecoveredNodes);
    this.state.isolatePerDay.push(actualIsolateNodes);
     // this.state.hea  .push( population - ( actualRecoveredNodes + actualInfectedNodes + actualDeadNodes ) );

    this.state.centerNodeNeighborsToDisplay = centerNodeNeighborsToDisplay;

    // Update the number of active nodes, and the playing bit if necessary
    this.setState({
      numActiveNodes: actualInfectedNodes,
      playing: this.state.playing && actualInfectedNodes !== 0,
    });

    this.redraw(true);
  }

  isCenterNode(r: number, c: number): boolean {
    return r === Math.floor(this.state.gridRows / 2) && c === Math.floor(this.state.gridCols / 2);
  }

  maybeInfect(node: GridNode, r: number, c: number, linkedNodes: Set<GridNode>): GridNode[] {
    let neighbors = [];
    if (node.canInfectOthers() || this.isCenterNode(r, c)) {
      neighbors = this.getNeighbors(node, r, c, linkedNodes);
    }

    if (node.canInfectOthers()) {
      let transProb = this.state.transmissionProbability;
      transProb = Math.pow(transProb, 3);

      for (let neighbor of neighbors) {
        node.tryToInfect(neighbor, transProb);
      }
    }
    return neighbors;
  }

  chooseRandomNeighbor(node: GridNode, r: number, c: number): GridNode {
    let radius = this.state.travelRadius;

    let neighbor = null;
    while (neighbor === null) {
      let dr = this.rng.randIntBetween(-radius, radius);
      let dc = this.rng.randIntBetween(-radius, radius);

      if (dr === 0 && dc === 0) {
        continue;
      }

      // special case for radius 1: only immediate neighbors
      if (radius === 1) {
        if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
          continue;
        }
      }

      let nr = r + dr;
      let nc = c + dc;

      if (nr < 0 || nr >= this.grid.length || nc < 0 || nc >= this.grid[0].length) {
        continue;
      }

      neighbor = this.grid[nr][nc];
    }
    return neighbor;
  }

  // noinspection JSUnusedLocalSymbols
  getNeighbors(node: GridNode, r: number, c: number, linkedNodes: Set<GridNode>): GridNode[] {
    let neighbors = [];
    let personHours = this.state.personHours;
    if (node.isIsolating()) {
      // if (this.rng.random() < this.state.chanceOfIsolationAfterSymptoms) {
      personHours *= (1-this.state.decreaseInEncountersAfterSymptoms);
      // }
    }
    if (this.state.travelRadius === 0) {
      // do nothing, just return empty list
    } else if (this.state.travelRadius === 1 && personHours === 4) {
      // Just the four cardinal neighbors
      if (r > 0) {
        neighbors.push(this.grid[r-1][c]);
      }
      if (c > 0) {
        neighbors.push(this.grid[r][c-1]);
      }
      if (r < this.grid.length - 1) {
        neighbors.push(this.grid[r+1][c]);
      }
      if (c < this.grid[0].length - 1) {
        neighbors.push(this.grid[r][c+1]);
      }
    } else {
      // Regular probabilistic neighbors
      while (neighbors.length < personHours) {
        let n = this.chooseRandomNeighbor(node, r, c)
        neighbors.push(n)
      }
    }
    return neighbors
  }

  togglePlayback() {
    if (this.state.numActiveNodes === 0) {
      // If network is dead, play button acts as reset + play button.
      this.generate(true);
    }
    this.setState({
      playing: !this.state.playing,
    });
  }

  inInitialPosition(): boolean {
    return this.state.infectedPerDay.length === 0;
  }

  redraw(force: boolean) {
    if (this.canvas === null || this.canvas === undefined) {
      console.log('no canvas');
      return;
    }

    // actually redraw iff any of the drawing parameters have changed
    let currentDrawingParams = [
        this.state.drawNodeOutlines,
        this.state.longDistaceNetworkActive,
        this.state.personHours,
        this.state.travelRadius,
    ];
    if (!force && Utils.arraysEqual(this.previousDrawingParams, currentDrawingParams)) {
      // console.log('no draw');
      return;
    }
    this.previousDrawingParams = currentDrawingParams;


    // actually redraw iff any of the drawing parameters have changed
    let showInteractionsParams = [
        this.state.personHours,
        this.state.travelRadius,
    ];
    let interactionsParamsChanged = !Utils.arraysEqual(this.previousInteractionsParams, showInteractionsParams);
    this.previousInteractionsParams = showInteractionsParams;


    // console.log('redrawing...');

    let context = this.canvas.getContext('2d');
    context.fillStyle = '#FFF';
    context.fillRect(0, 0, this.gridWidth, this.gridWidth);

    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        let node = this.grid[r][c];
        this.drawCell(r, c, node, context, false);
      }
    }

    // if (this.props.showInteractions &&
    //     this.state.centerNodeNeighborsToDisplay &&
    //     this.state.centerNodeNeighborsToDisplay.length > 0) {
    if (this.props.showInteractions && (interactionsParamsChanged || this.inInitialPosition())) {
      let centerR = Math.floor(this.state.gridRows / 2);
      let centerC = Math.floor(this.state.gridCols / 2);

      let centerNode = this.grid[centerR][centerC];

      // let neighbors = this.state.centerNodeNeighborsToDisplay;
      let neighbors = this.getNeighbors(centerNode, centerR, centerC, null);

      // this.drawCell(centerR, centerC, centerNode, context, true);
      for (let node of neighbors) {
        this.drawCell(node.r, node.c, node, context, true);
      }
      for (let node of neighbors) {
        this.drawInteraction(centerR, centerC, node.r, node.c, context)
      }
    }
  }

  drawInteraction(r1: number, c1: number, r2: number, c2: number, context) {
    let w = this.nodeSize;

    context.strokeStyle = '#000';
    context.beginPath();
    context.moveTo((c1 + 0.5) * w, (r1 + 0.5) * w);
    context.lineTo((c2 + 0.5) * w, (r2 + 0.5) * w);
    context.stroke();
  }

  drawCell(r: number, c: number, node: GridNode, context, highlight: boolean) {
    let w = this.nodeSize;
    let y = r * w;
    let x = c * w;

    if (node.isExposed()) {
      context.fillStyle = Constants.EXPOSED_COLOR;
    } else if (node.isInfected()) {
      if (node.isIsolating()) {
        context.fillStyle = Constants.ISOLATING_COLOR;
      } else {
        context.fillStyle = Constants.INFECTED_COLOR;
      }
    } else if (node.isRemoved()) {
      context.fillStyle = Constants.REMOVED_COLOR;
    } else if (node.isDead()) {
      context.fillStyle = Constants.DEAD_COLOR;
    } else {
      // Node is susceptible
      context.fillStyle = Constants.SUSCEPTIBLE_COLOR;

      if (node.specialDegree !== null) {
        // should be somewhere between 4 and 8
        Utils.assert(node.specialDegree >= 4 && node.specialDegree <= 8, "node.specialDegree should be between 4 and 8; was: " + node.specialDegree);
        let intensity = (node.specialDegree - 4) / 4.0;
        context.fillStyle = Colors.hex(Colors.blend(Colors.makeHex(Grid.SUSCEPTIBLE_COLOR), Colors.makeHex('#BBB'), intensity))
      }
    }

    let gap = 1;
    if (this.nodeSize < 5 || this.nodeSize < this.props.nodeSize) {
      gap = 0;
    }

    // context.fillRect(x, y, w, w);
    context.fillRect(x, y, w - gap, w - gap);
    // context.beginPath();
    // context.arc(x+w/2, y+w/2, w/2-1, 0, 2 * Math.PI);
    // context.fill();

    if (highlight || (node.linked && this.state.longDistaceNetworkActive)) {
      // context.beginPath();
      context.lineWidth = 1;
      context.strokeStyle = '#000';
      let left = x - 0.5;
      let wid = w - gap + 1;
      if (x === 0) {
        left = 0.5;
        wid = wid - 1;
      }
      let top = y - 0.5;
      let hei = w - gap + 1;
      if (y === 0) {
        top = 0.5;
        hei = hei - 1;
      }
      // if (node.isIsolating()) {
      //   context.strokeRect(left+1, top+1, wid-2, hei-2);
      // } else {
      context.strokeRect(left, top, wid, hei);
      // }
    }
  }

  static renderPercentage(fraction: number) {
    let percent = Math.round(fraction * 100);
    return <span><strong>{percent}</strong>%</span>;
  }

  onClickUpdateWorld()
  {
    let worldSideSize = Math.round( Math.sqrt( this.state.populationSize ) );

    this.setState({gridRows: worldSideSize});
    this.setState({gridCols: worldSideSize});

    this.state.gridRows =  worldSideSize;
    this.state.gridCols =  worldSideSize;

    if ( this.state.populationSize < 100000 )
    {
      this.state.nodeSize = 3;
    }
    else if ( this.state.populationSize > 100000 ) {
      this.state.nodeSize = 2;
    }
    else if ( this.state.populationSize > 500000 ) {
      this.state.nodeSize = 1;
    }

    this.updateWindowDimensions();
    this.generate( true );
    this.forceUpdate()
  }


  // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  renderSlider(name: string, value: number, onChange: Function, onChange2: Function, min: number, max: number, step: number,
               renderPercentage: boolean, highlighted: boolean, isInteger: Boolean) {
    let valueStr;
    if (renderPercentage === 0) {
      valueStr = "";
    } else if (renderPercentage) {
      valueStr = <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{Grid.renderPercentage(value)}</span>;
    } else if (isInteger) {
      valueStr = <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>{Math.round(value*100)/100}</strong></span>;
    } else {
      valueStr = <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>{value.toFixed(3)}</strong></span>;
    }

    let highlightedClass = "";
    if (highlighted) {
      highlightedClass = " highlighted"
    }

    let applyButton =  null;

    if (onChange2)
    {
      applyButton = <div className="slider-plus">
        <WidgetButton size="small" onClick={() => onChange2(null, value) }><span className="plus-minus-button">+</span></WidgetButton>
      </div>;
    }

    return (
      <div className={"slider-container" + highlightedClass}>
        <div className="slider-name">{name}{valueStr}</div>
        <div className="slider-slider">
          <Slider classes={{
                    container: 'slider-slider-container',
                    thumbIconWrapper: "",
                  }}
                  // thumb={
                  //   <img
                  //     alt="slider thumb icon"
                  //     src="/static/images/misc/circle.png"
                  //   />
                  // }
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={onChange}/>
        </div>
        {/*<div className="slider-minus">*/}
        {/*  <WidgetButton size="small" onClick={() => onChange(null, Math.max(value - step, min))}><span className="plus-minus-button">–</span></WidgetButton>*/}
        {/*</div>*/}
        {/*<div className="slider-plus">*/}
        {/*  <WidgetButton size="small" onClick={() => onChange(null, Math.min(value + step, max))}><span className="plus-minus-button">+</span></WidgetButton>*/}
        {/*</div>*/}

        {applyButton}

      </div>
    );
  }

  render() {
    this.generate();
    this.redraw();

    let showAll = this.props.showAllControls;

    let transmissionProbabilitySlider = null;
    if (showAll || this.props.showTransmissionProbabilitySlider) {
      transmissionProbabilitySlider =
          this.renderSlider(Translation.TRANSMISSION_RATE, this.state.transmissionProbability,
              (e, value) => { this.setState({transmissionProbability: value}); },
              0, this.props.maxTransmissionRate, 0.01, false, this.props.highlight === "transmissionRate", false);
    }

    let immunityFractionSlider = null;
    // if (showAll || this.props.showImmunityFractionSlider) {
    //   let sliderName = this.props.immunitySliderName || "Immunity";
    //
    //   immunityFractionSlider =
    //       this.renderSlider(sliderName, this.state.immunityFraction,
    //           (e, value) => { this.setState({immunityFraction: value}); },
    //           0, 1, 0.01, true, this.props.highlight === "immunity");
    // }

    let hospitalCapacitySlider = null;
    if (showAll || this.props.showHospitalCapacitySlider) {
      // decoy slider
      // hospitalCapacitySlider =
      //     this.renderSlider("Hospital capacity", this.state.hospitalCapacityPct,
      //         (e, value) => { this.setState({hospitalCapacitySliderHighlighted: true}); },
      //         0, 1, 0.01, true, this.state.hospitalCapacitySliderHighlighted);



      let nRows = this.props.gridRows;
      let nCols = this.props.gridCols;

      let population = nRows * nCols;

      // console.log( population );

      hospitalCapacitySlider =
          this.renderSlider(Translation.HOSPITAL_CAPACITY, this.state.hospitalCapacitySize,
              (e, value) => {

                  let percentage = value / population;

                  //console.log( percentage );
                  // console.log( value );

                this.setState({hospitalCapacitySize: value});
                this.setState({hospitalCapacityPct: percentage});

                },
              null,
              0, 5000, 1, false, false, true);

    }

    let populationSlider = null;
    if ( true ) {
      populationSlider =
          this.renderSlider( "Численность населения, чел.", this.state.populationSize,
              (e, value) => {
                let worldSideSize = Math.round( Math.sqrt( value ) );
                this.setState({populationSize: worldSideSize * worldSideSize});

              },
              (e, value) => {
                this.onClickUpdateWorld();
              },
              1000, 5000000, 1, false, false, true);
    }


    let travelRadiusSlider = null;
    if (showAll || this.props.showTravelRadiusSlider) {
      travelRadiusSlider =
          this.renderSlider(Translation.TRAVEL_RADIUS, this.state.travelRadius,
              (e, value) => { this.setState({travelRadius: value}); },
              null,
              0, Math.min(100, Math.floor(this.state.gridRows/2)), 1, false, false, true);
    }

    let personHoursSlider = null;
    if (showAll || this.props.showPersonHoursSlider) {
      personHoursSlider =
          this.renderSlider(Translation.ENCOUNTERS_PER_DAY, this.state.personHours,
              (e, value) => { this.setState({personHours: value}); },
              null,
              1, 30, 1, false, false, true);
    }

    let daysIncubatingSlider = null;
    if (showAll || this.props.showDaysPerStateControls) {
      daysIncubatingSlider =
          this.renderSlider(Translation.DAYS_IN_INCUBATION, this.state.daysIncubating,
              (e, value) => { this.setState({daysIncubating: value}); },
              null,
              0, 20, 1, false, false, true);
    }

    let daysSymptomaticSlider = null;
    if (showAll || this.props.showDaysPerStateControls) {
      daysSymptomaticSlider =
          this.renderSlider(Translation.DAYS_WITH_SYMPTOMS, this.state.daysSymptomatic,
              (e, value) => { this.setState({daysSymptomatic: value}); },
              null,
              1, 20, 1, false, false, true);
    }

    let chanceOfIsolationAfterSymptomsSlider = null;
    if (showAll || this.props.showChanceOfIsolationAfterSymptomsSlider) {
      chanceOfIsolationAfterSymptomsSlider =
          this.renderSlider(Translation.SELF_QUARANTINE_RATE, this.state.chanceOfIsolationAfterSymptoms,
              (e, value) => { this.setState({chanceOfIsolationAfterSymptoms: value}); },
              null,
              0, 1, 0.01, false, false, false);
    }

    let decreaseInEncountersAfterSymptomsSlider = null;
    if (showAll || this.props.showDecreaseInEncountersAfterSymptomsSlider) {
      decreaseInEncountersAfterSymptomsSlider =
          this.renderSlider(Translation.SELF_QUARANTINE_STRICTNESS, this.state.decreaseInEncountersAfterSymptoms,
              (e, value) => { this.setState({decreaseInEncountersAfterSymptoms: value}); },
              null,
              0, 1, 0.01, false, false, false);
    }

    let deathRateSlider = null;
    if (showAll || this.props.showDeathRateSlider) {
      let sliderName = Translation.INPUT_FATALITY_RATE;
      if (this.state.hospitalCapacityPct > -1) {
        sliderName = Translation.INPUT_FATALITY_RATE;
      }

      deathRateSlider =
          this.renderSlider(sliderName, this.state.deathRate,
              (e, value) => { this.setState({deathRate: value}); },
              null,
              0, 1, 0.01, false, false, false);
    }

    // let speedSlider = null;
    // let speedMinusButton = null;
    // let speedPlusButton = null;
    // if (showAll || this.props.showSpeedControls) {
    //   speedMinusButton = <WidgetButton onClick={() => { this.setState({speed: Math.max(0, this.state.speed - 0.20)}) }}>🚶</WidgetButton>;
    //   speedPlusButton = <WidgetButton onClick={() => { this.setState({speed: Math.min(1, this.state.speed + 0.20)}) }}>🏃</WidgetButton>;
    //   speedSlider =
    //       this.renderSlider("Speed", this.state.speed,
    //           (e, value) => { this.setState({speed: value}); },
    //           0, 1, 0.01, 0, false);
    // }

    let playbackControls = null;
    if (showAll || this.props.showPlaybackControls) {
    let newNetworkButton = <WidgetButton onClick={() => {this.resetPlotVariables();this.generate(true); this.forceUpdate();this.setState({playing: false}); } } >{Translation.BUTTON_RESET}</WidgetButton>;
      let text = <span style={{fontSize: '10pt'}}>▷</span>;
      if (this.state.playing) {
        text = <span><b>||</b></span>;
      }
    
      let togglePlaybackButton = <WidgetButton highlighted={!this.state.playing} onClick={() => {this.togglePlayback(); } } >{text}</WidgetButton>;
      let stepButton = <WidgetButton onClick={() => {this.simulateStep(); this.setState({playing: false}); } } >{Translation.BUTTON_STEP}</WidgetButton>;
      //not needed can delete
      let clearButton = <WidgetButton onClick={() => {this.resetPlotVariables();this.setState({playing: false});} } >{Translation.BUTTON_CLEAR}</WidgetButton>;
      playbackControls =
        <div className='playback-controls-container'>
          {newNetworkButton}
          {togglePlaybackButton}
          {stepButton}
          {/* {clearButton} */}
          {/*{speedMinusButton}*/}
          {/*{speedPlusButton}*/}
        </div>
    }

    let toggleLongDistanceNetwork = null;
    if (this.props.addLinkedNodes) {
      let text = 'Long distance: disabled';
      if (this.state.longDistaceNetworkActive) {
        text = 'Long distance: enabled';
      }
      toggleLongDistanceNetwork = <div><span onClick={() => {this.setState({longDistaceNetworkActive: !this.state.longDistaceNetworkActive}); } } >{text}</span></div>;
    }

    let percentAliveSlider = null;
    // if (this.props.showAliveFraction || showAll) {
    //   let fractionAlive = this.state.numActiveNodes / (this.props.gridRows * this.props.gridCols);
    //   // noinspection JSSuspiciousNameCombination
    //   percentAliveSlider = <div>
    //     <Slider style={{height: this.gridWidth, marginLeft: '0.5rem'}}
    //             classes={{
    //               // track: { color: 'pink', width: 50, height: 100 },
    //               // thumb: { display: 'none' },
    //             }}
    //             min={0}
    //             max={1}
    //             value={fractionAlive}
    //             thumb={<span/>}
    //             vertical
    //             />
    //   </div>
    // }

    let protip = null;
    if (this.props.showProTip) {
      protip = (
          <div style={{color: '#666', fontSize: '12pt', marginTop: '1em'}}>👆 Pro-tip: You can adjust sliders while the simulation is running.</div>
      );
    }

    let intervalMillis = 1000 * (1-Math.pow(this.state.speed, 1/5));
    intervalMillis = Math.max(intervalMillis, 16);

    let highlightedSlider = null;
    if (this.props.highlight === "transmissionRate") {
      highlightedSlider = transmissionProbabilitySlider;
      transmissionProbabilitySlider = null;
    } else if (this.props.highlight === "immunity") {
      highlightedSlider = immunityFractionSlider;
      immunityFractionSlider = null;
    }

    let plot = null;
    if (this.props.showAliveFraction) {
      let population = this.state.gridRows * this.state.gridCols;      
      plot = <Plot hospitalCapacity={this.state.hospitalCapacityPct * population}
                   capacityPerDay={this.state.capacityPerDay}
                   deadPerDay={this.state.deadPerDay}
                   healthyPerDay={this.state.healthyPerDay}
                   infectedPerDay={this.state.infectedPerDay}
                   population={population}
                   recoveredPerDay={this.state.recoveredPerDay}
                   showDeaths={this.props.showDeaths}
                   isolatePerDay={this.state.isolatePerDay} />;
    }

    let grid_legend = (  <div>
      <ul>
      <ul class="hl">
        <li><NodeLegend type="susceptible"/> &nbsp;<b>Восприимчив</b></li>
        <li><NodeLegend type="exposed"/> &nbsp;<b>Инфицирован (инкубационный период)</b></li>
        <li><NodeLegend type="infected"/> &nbsp;<b>Инфицирован (с симптомами)</b></li>
      </ul>
      <ul class="hl">
        <li><NodeLegend type="removed"/> &nbsp;<b>Выздоровел</b></li>
        <li><NodeLegend type="isolating"/> &nbsp;<b>Самоизоляция</b></li>
        <li><NodeLegend type="dead"/> &nbsp;<b>Погиб</b></li>
      </ul>
      </ul>
    </div>);

    return (
        <div>
          {/*<div style={{display: 'flex', flexDirection: 'row'}}>*/}
          {/*  <Waypoint onEnter={this.onEnter} onLeave={this.onLeave} scrollableAncestor={window}>*/}
          {/*    <canvas ref={this.canvasRef} width={this.gridWidth} height={this.gridWidth} />*/}
          {/*  </Waypoint>*/}
          {/*  {percentAliveSlider}*/}
          {/*</div>*/}
          {/*{playbackControls}*/}


          <div style={{'display': 'flex', 'flexDirection': 'cols','margin': 'auto', 'text-align': 'center'}}>
            <div style={{'margin-left': 'auto'}}>
              {plot}
            </div>
            <div style={{'margin-right': 'auto', 'margin-left': '20px'}}>
              {populationSlider}
              {highlightedSlider}
              {hospitalCapacitySlider}
              {deathRateSlider}
              {chanceOfIsolationAfterSymptomsSlider}
              {decreaseInEncountersAfterSymptomsSlider}
              {personHoursSlider}
              {travelRadiusSlider}
              {transmissionProbabilitySlider}
              {immunityFractionSlider}
              {daysIncubatingSlider}
              {daysSymptomaticSlider}
              {toggleLongDistanceNetwork}
              {protip}

              <div style={{'margin-top': '20px'}}>
                {playbackControls}
              </div>
            </div>
          </div>

          <div style={{'margin': 'auto', 'text-align': 'center', 'margin-top': '20px'}}>
            <Waypoint onEnter={this.onEnter} onLeave={this.onLeave} scrollableAncestor={window}>
              <canvas style={{'border': '2px double black'}}  ref={this.canvasRef} width={this.gridWidth} height={this.gridWidth} />
            </Waypoint>
            {percentAliveSlider}
            {grid_legend}
          </div>

          {/*{speedSlider}*/}
          <Interval milliseconds={intervalMillis} callback={this.onTick} />
        </div>
    )
  }
}