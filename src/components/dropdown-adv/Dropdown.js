import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableHighlight,
    TouchableWithoutFeedback, TextInput, Platform, Dimensions, PanResponder, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
// import Fuse from "fuse.js";
import Fuse from "../../../node_modules/fuse.js/src/index";

const {height, width} = Dimensions.get("window");

class Dropdown extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            selected:props.selected,
            minHeight: 0,
            height:0,
            animation   : new Animated.Value(0),
            data:props.data,
            perPage:props.perPage,
            title:props.title,
            dropdownOpen: 0,
            searchQuery: '',
            searchResult: props.data,
            currentPage:1,
            maxPage:Math.ceil(props.data.length/props.perPage),
            paginated: [],
        }

    }


    componentWillMount() {
        this.setState({
            height:null,
            minHeight:200,
        })
        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder:(evt, gestureState) => {
                console.log(gestureState);
            },
            onPanResponderMove: (evt, gestureState) => {
                // console.log(gestureState);
                // DO JUNK HERE
            }
        });
    }

    componentDidUpdate (prevProps, prevState) {
        if(this.state.searchQuery!== prevState.searchQuery){
            this.search();
        }
        let entries = Object(this.state.searchResult).length ? this.state.searchResult : this.state.data;
        if (this.state.maxPage !==  Math.ceil(entries.length/this.state.perPage)) {
            this.setState({maxPage: Math.ceil(entries.length / this.state.perPage)});
        }
    }

    _setMaxHeight(event){
        this.setState({
            //maxHeight   : event.nativeEvent.layout.height
            maxHeight   : 400,
        });
    }

    _setMinHeight(event){
        console.log(event.nativeEvent.layout.height);
        this.setState({
            // minHeight   : event.nativeEvent.layout.height
            minHeight   : 0,
        });
    }

    _toggleDropdown = () => {
        let initialValue    = this.state.dropdownOpen ? this.state.maxHeight + this.state.minHeight : this.state.minHeight;
        let finalValue      = this.state.dropdownOpen ? this.state.minHeight : this.state.maxHeight + this.state.minHeight;

        this.setState({dropdownOpen:!!((this.state.dropdownOpen+1)%2)});
        this.state.animation.setValue(initialValue);
        Animated.spring(
            this.state.animation,
            {
                toValue: finalValue,
                overshootClamping: true,
                tension: 100,
                friction: 10,
                delay: 20,
            }
        ).start();
    }

    _onPressButton(key, func) {
        //func();
        this.props.selected.setState({selected:key});
        this._toggleDropdown();
    }

    _renderSearchBar = () => {
        return (
            <View style={{
                flex:0,
                flexDirection: 'row',
                justifyContent: 'space-evenly',
            }}>
                <View style={{
                    flex:4,
                    alignSelf: 'center',
                }}>
                    <TextInput
                        underlineColorAndroid={"transparent"}
                        style={ styles.searchBar }
                        placeholder="Start typing to search"
                        onChangeText={ (text) => this.setState({searchQuery:text}) }
                    />
                </View>
                <View style={{
                    flex:1,
                    alignSelf: 'center',
                }}>
                    <Icon name={"md-search"} size={15}/>
                </View>
            </View>
        );
    }

    _renderDropdownElements = () => {
        let entries = Object(this.state.searchResult).length ? this.state.searchResult : this.state.data;
        entries=this._paginate(entries)[this.state.currentPage-1];
        let data = entries.map( dataEntry=> ({key: Object.keys(dataEntry).includes("item") ? dataEntry.item.label : dataEntry.label, func: Object.keys(dataEntry).includes("item") ? dataEntry.item.func : dataEntry.func })  );

        return (
            <FlatList style={{
                // flex:1,
            }} data={data} renderItem={({item}) => (
                <TouchableHighlight key={item.key} onPress={ () => this._onPressButton(item.key, item.func)} underlayColor="white">
                    <View >
                        <Text style={styles.item}>{item.key}</Text>
                    </View>
                </TouchableHighlight>

            )}/>
        )
    };

    _paginate = (data) => {
        let currentPage = 0;
        let tempPaginated = [[]];
        for (let i = 0; i<data.length; i++){
            tempPaginated[currentPage].push(data[i]);
            if ((i+1) % this.state.perPage === 0) {
                currentPage++;
                tempPaginated.push([]);
            }
        }
        return tempPaginated;
    }

    _renderPagination = () => {

        return (
            <View style={{
                flex:0,
                flexDirection:'row',
                alignItems:'center',
                justifyContent: 'flex-end',
            }}>
                <TouchableWithoutFeedback hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                          onPress={ ()=> {
                                              this.setState({ currentPage : Math.max(1, (this.state.currentPage-1) ) });
                                          } }>

                    <View style={{ borderColor:'rgba(0,0,0,0.1)', borderWidth:0, padding:5, width:30 }}>
                        <Icon size={25} name={"md-arrow-dropleft"} style={{ margin:5 }}/>
                    </View>
                </TouchableWithoutFeedback>

                <Text>{this.state.currentPage} / {this.state.maxPage}</Text>

                <TouchableWithoutFeedback hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                          onPress={ ()=> {
                                              this.setState({currentPage : Math.min(this.state.currentPage+1 ,
                                                      this.state.maxPage) });
                                          } }>

                    <View style={{ borderColor:'rgba(0,0,0,0.1)', borderWidth:0, padding:5, width:30, }}>
                        <Icon size={25} name={"md-arrow-dropright"} style={{ margin:5 }}/>
                    </View>
                </TouchableWithoutFeedback>
            </View>

        )
    }

    search = () => {
        const options = {
            shouldSort: true,
            tokenize: false,
            includeScore: true,
            threshold: 0.4,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                "label"
            ]
        };
        if (this.state.currentPage !== 1) this.setState({currentPage:1});
        console.log(this.state.searchQuery);
        let fuse = new Fuse(this.state.data, options);
        let result = fuse.search(this.state.searchQuery);
        if( result !== this.state.searchResult ) this.setState({searchResult: result});
    }

    render() {
        return (
            <View style={[Platform.OS === 'ios'? styles.iosStyle : '', { margin:40, }]}
            >
                <View />
                <TouchableWithoutFeedback
                    onLayout={this._setMinHeight.bind(this)}
                    onPress={ ()=>this._toggleDropdown()}>
                    <View style={ styles.menuButton }>
                        <Text style={{fontSize:15,}}>
                            {this.state.title} <Icon size={15} name={"ios-arrow-dropdown"} />
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
                <View>
                    <Animated.View  onLayout={this._setMaxHeight.bind(this)}
                                    {...this._panResponder.panHandlers}
                                    style={[styles.dropdown,
                                        {
                                            opacity: this.state.animation,
                                            height: this.state.animation,
                                            minHeight: this.state.animation,
                                            // display: Math.ceil(this.state.animation) ? 'block' : 'none',
                                        }]}>
                        {this._renderSearchBar()}
                        <View style={[ styles.horizontalRuler, {marginTop:0} ]} />
                        {this._renderDropdownElements()}
                        <View style={styles.horizontalRuler}/>
                        {this._renderPagination()}
                    </Animated.View>
                </View>
            </View>
        );
    }
}

const styles= StyleSheet.create({
    fullScreen: {
        width:width,
        height: height,
    },
    iosStyle:{
        zIndex:99,
    },
    paginationButton: {

    },
    searchBar: {
        height:40,
    },
    menuButton: {
        backgroundColor: "#bfbfbf",
        padding:10,
    },
    dropdown: {
        position: 'absolute',
        width: '100%',
        zIndex: 99,
        minHeight: 200,
        maxHeight: 400,
        padding: 10,
        backgroundColor: "#fbfbf3",
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    item: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
    button: {
        marginBottom: 30,
        width: 260,
        alignItems: 'center',
        backgroundColor: '#2196F3'
    },
    buttonText: {
        padding: 20,
        color: 'white'
    },
    horizontalRuler: {
        borderWidth: 0.5,
        borderColor:'black',
        opacity:0.2,
        marginTop:10,
        marginLeft: 5,
        marginRight: 5,
    },
})

export default Dropdown;