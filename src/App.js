import React, { Component } from 'react';
import * as L from 'leaflet';
import './App.css';

const api_server = "https://cors-anywhere.herokuapp.com/http://40.121.64.107:8080"; 
const server = "http://localhost:3300"

class App extends Component {

  mymap;
  postes;

  state = {
    initCoordenate: {lat: 1.6221805996275647, lng: -75.60913026798518},
    zoom: 18
  }

  constructor(props){
    super(props);
  }
 
  componentDidMount(){
    this.mymap = L.map('mapid').setView([this.state.initCoordenate.lat, this.state.initCoordenate.lng], this.state.zoom);

    this.initLayerMap();

    fetch(`${server}/postes`)
    .then((response) => response.json())
    .then((data) => {
      let parse = [];
      data.map(item => {
        parse[parseInt(item.id) - 1] = item;
      });
      this.postes = parse;
      this.getShpGeoJSON('PostesLibertad3');
      this.getShpGeoJSON('RangoIluminacion');
    });
    //this.getShpGeoJSON('ViasF');
  }

  render() {
    return (
      <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
        <div id="mapid" ></div>
      </div>
    );
  }

  initLayerMap(){
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoieWVpc29uZ29tZXoyOCIsImEiOiJjanNxejdiZnQwZzZ4M3lwYW15Znh3ZHAwIn0.8Z-H69gSG56_IdqoTU4EJg', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 19,
      id: 'mapbox.streets',
      accessToken: 'your.mapbox.access.token'
    }).addTo(this.mymap);
  }

  getShpGeoJSON(name){
    var owsrootUrl = `${api_server}/geoserver/ows`;
		var parameters = L.Util.extend({
			service: 'WFS',
			version: '1.0.0',
		  request: 'GetFeature',
			typeName: 'ProyectoSig:' + name,
      outputFormat: 'application/json',
      SrsName : 'EPSG:4326'
		});
			
    fetch(owsrootUrl + L.Util.getParamString(parameters))
    .then((response) => response.json())
    .then((data) => {
      const geojsonLayerWells = new L.GeoJSON(data, {
        onEachFeature: (feature, layer) => {
          if(feature.id.includes("PostesLibertad")){
            let popupOptions = { maxWidth: 200 };
            let logoMarkerStyle = L.Icon.extend({ options: { iconSize: [40, 45] } });
            let logoMarker = new logoMarkerStyle({iconUrl: 'https://image.flaticon.com/icons/png/512/89/89055.png'});
            layer.setIcon(logoMarker);
            let popup = layer.bindPopup(this.getComponentPopup(feature.id), popupOptions);
            let id = feature.id.split(".")[1];
            layer.on('popupopen', () => {
              L.DomEvent.on(document.getElementById("button-" + id), 'click',
                (layer) => {
                  this.updateState(document.getElementById("select-" + id).value, id, popup);
                }
              );
            });
          }
        }
      });
      geojsonLayerWells.addTo(this.mymap);
    });
  }

  updateState(state, id, popup){
    let message = document.getElementById("message-"+id).value;
    fetch("http://localhost:3300/postes", { 
      method: 'PUT', 
      body: JSON.stringify({ id: id, message: message, state: state }),
      headers: { 'Content-Type': 'application/json' }
    })
    .then((response) => response)
    .then((data) => {
      document.getElementById(`text-estado-${id}`).innerHTML = "Estado: " + state;
      this.postes[parseInt(id) - 1].estado = state;
      this.postes[parseInt(id) - 1].mensaje = document.getElementById("message-"+id).value;
      popup.setPopupContent(this.getComponentPopup('.' + id));
    });
  }

  getComponentPopup(id){
    id = id.split(".")[1];
    let estado = this.postes[parseInt(id) - 1].estado;
    let mensaje = this.postes[parseInt(id) - 1].mensaje;
    
    return `
      <h3>Poste #${ id }</h3>
      <p id="text-estado-${id}">Estado: ${ estado }</p>
      <input type="text" placeholder="Sin mensaje" id="message-${id}" value="${mensaje? mensaje: ''}"/>
      <select autocomplete="off" id="select-${id}">
        <option ${ estado === "Funcionando"? 'selected="true"': '' } value="Funcionando">Funcionando</option>
        <option ${ estado !== "Funcionando"? 'selected="true"': '' } value="No funcionando">No funciona</option>
      </select>
      <button id="button-${id}">Actualizar</button>
    `;
  }
}

export default App;
