import {IInputs, IOutputs} from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
import { BorderWidth, Chart, Point, ChartColor } from 'chart.js';
type DataSet = ComponentFramework.PropertyTypes.DataSet;
const plugin = {
    afterDraw: (chartInstance: Chart, easing: Chart.Easing, options?: any) => { },
};

export class ActivityAnalyzer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	private _context: ComponentFramework.Context<IInputs>;
	private _container: HTMLDivElement;
	private _numberOfRecords: number;
	private _viewId: string;
	// Flag if control view has been rendered
	private _controlViewRendered: Boolean;
	/**
	 * Empty constructor.
	 */
	constructor()
	{

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{
		debugger;
		// Add control initialization code
		this._context = context;
		this._container = container;
		this._controlViewRendered = false;
		this.GetAllParams();
		this.InitializeChartWithData();
	}
	private GetAllParams()
	{
		this._viewId = this._context.parameters.dataSet.getViewId() == undefined ? "" : this._context.parameters.dataSet.getViewId();
		
	}
	private InitializeChartWithData(){
		this.ProcessAllRecordsInDataSet();
	}
	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		//We make sure that the data set loading is finished.
		if (!this._controlViewRendered && !context.parameters.dataSet.loading) {
			this._controlViewRendered = true;
			this._context = context;
			//Start the process for each records in the dataset (subgrid,view...).
			this.ProcessAllRecordsInDataSet();
		}
	}

	private ProcessAllRecordsInDataSet() {
			//We remove all items to make sure that if you perform a refresh, it will not add the records again.
		this.RemoveChildItems();
		var order = 1; // Used to keep the order of the records.
		this._numberOfRecords = this._context.parameters.dataSet.sortedRecordIds.length;
		var dataSetValue = new Array();
		this._context.parameters.dataSet.sortedRecordIds.forEach((currentRecordId) => {
			let entityReference = this._context.parameters.dataSet.records[currentRecordId].getNamedReference();
			let recordType = this._context.parameters.dataSet.records[currentRecordId].getFormattedValue("activitytypecode");
			let recordId  = currentRecordId;
			let ActivtyObject: {type:any,id:any}= {id: recordId, type: recordType  };
			dataSetValue.push(ActivtyObject);
		});
		
		var titleValue =["Appointment","Email","Fax","Letter","Phone Call","Task"];
		// dataSetValue.filter(function(item){
		// 	var i = titleValue.indexOf(item.type);
		// 	if(i <= -1){
		// 		titleValue.push(item.type);
		// 	}
		// 	return null;
		//   });
		var dataValue = new Array(titleValue.length);
		let iteration = 0;
		titleValue.forEach((activitytype)=>{
			let currentValue = 0;
			dataSetValue.filter(function(item){
				if(item.type == activitytype)
				{
					currentValue++;
				}
			});
			dataValue[iteration]=currentValue;
			iteration++;
		});
		
		this.GetChart(titleValue,dataValue);
	}
	
	private GetChart(labelValue: Array<string>, dataValue: Array<any>)
	{
		
		const doughnutChartOptions: Chart.ChartOptions = {
			
			legend: { display: true,labels: {
                fontColor: '#000000'
			}, position:'top' 
		},
			//scale: scaleOptions,
			responsive: true,
			animation: {
				animateScale: true,
				animateRotate: true
			},
			title: {
				display: true,
				text: 'Activity Analyzer'
			},
	};
		var _canvasElement = document.createElement('canvas');
		_canvasElement.id = "myChart";


		this._container.appendChild(_canvasElement);
		const chart: Chart = new Chart(_canvasElement, {
			type: 'doughnut',
			data: {
				labels:labelValue,
				datasets:[{ label:'Activity Count', data:dataValue,backgroundColor:["#F24F21","#7FBA00","#00A4EF","#FFB900","#006EC4","#7719AA"]}],
			},
			
			options:doughnutChartOptions
		});
	}

	private RemoveChildItems() {
		while (this._container.firstChild) {
			this._container.removeChild(this._container.firstChild);
		}
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary
	}

}