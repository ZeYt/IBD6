import React from 'react';
import { Form, Alert, Row, Col, Table, Pagination, Button, Badge, Modal } from 'react-bootstrap';

import InteractiveBrokersActivity from '../../parsers/IBactivity';
import Modelo720 from '../../builder/modelo720'
import './DropZone.css';

import countries from '../../static/countries.json'
import { Position } from '../../aforix/Position';
import InformesImage from '../../images/informes.png';
import { exception } from 'console';

export default class DropZone extends React.Component {

    data: InteractiveBrokersActivity | null = null

    state = {
        dni: '',
        text: '',
        status: 'dark',
        broker_country: '',
        eurusd: '',
        filename: '',
        active_page: 1,
        modalShow: false,
    }


    downloadTxtFile = (name: string, content: string) => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'application/aforixm' });
        element.href = URL.createObjectURL(file);
        element.download = `${name}.720`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    // https://blog.logrocket.com/create-a-drag-and-drop-component-with-react-dropzone/
    dragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }

    dragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }

    dragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }

    fileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        this.uploadFile(e.dataTransfer.files);
    }

    onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        this.uploadFile(e!.target!.files!);
    };

    uploadFile(files: any) {

        var promises = [];
        for (var i = 0; i < files.length; i++) {
            this.setState({ filename: files[i].name });
            promises.push(files[i].text())
        }

        Promise.all(promises)
            .then((file_texts) => {
                this.data = new InteractiveBrokersActivity(file_texts[0]);
            }).then(() => {

                let warning = (this.data!.open_positions!.filter((item)=>item.ISIN?false:true).length > 0)

                if (warning)
                    this.setState({ status: 'warning', text: 'Fichero cargado. Revise los elementos' })
                else
                    this.setState({ status: 'success', text: 'Fichero cargado' })
            }).catch(() => {
                this.setState({ status: 'danger', text: 'Ha ocurrido un error al leer el fichero.' })
            })
    }

    displayForex() {
        const items = [];

        if (this.data != null) {
            for (var key in this.data.forex) {
                if (key == "EUR") continue;
                items.push(<Form.Group>
                    <Form.Label>EUR{key}</Form.Label>
                    <Form.Control placeholder={this.data!.forex[key].toFixed(4)}
                        value={this.state.eurusd}
                        onChange={e => this.setState({ eurusd: e.target.value })} />
                    <Form.Text className="text-muted">
                        Valor calculado a partir del informe subido
                    </Form.Text>
                </Form.Group>)
            }
        }

        return items;
    }



    displayElements() {

        if (this.data == null) { return }
        let items = this.data!.open_positions!.map((item: Position, index: number) => {
            return (
                <tr>
                    <td>{index + 1}</td>
                    <td>{item.description}</td>
                    <td>{item.ISIN}</td>
                    <td>{item.count}</td>
                    <td>{item.value}{item.currency}</td>
                    <td>{(item.value / this.data!.forex[item.currency]).toFixed(2)}EUR</td>
                </tr>
            )
        });

        let items_pagination = [];
        for (let number = 1; number <= ((items.length) / 10) + 1; number++) {
            items_pagination.push(
                <Pagination.Item key={number} active={number === this.state.active_page} onClick={() => this.setState({ active_page: number })}>
                    {number}
                </Pagination.Item>,
            );
        }
        return (
            <div>
                <Table striped bordered hover size="sm" variant="dark">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>ISIN</th>
                            <th>Número</th>
                            <th>Valor</th>
                            <th>Valor en euros</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.slice((this.state.active_page - 1) * 10, this.state.active_page * 10)}
                    </tbody>
                </Table>
                <Pagination size="sm">{items_pagination}</Pagination>
            </div>
        )
    }


    MyVerticallyCenteredModal(props: any) {
        return (
            <Modal
                {...props}
                size="xl"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Como generar el informe anual en Interactive Brokers
              </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul>
                        <li>Dirigete al apartado informes de Interactive Brokers</li>
                        <li>En la pestaña Extractos, ejecuta la consulta <b>Actividad</b> con las siguientes opciones:</li>
                        <ul>
                            <li>Periodo: <b>Anual</b></li>
                            <li>Fecha: <b>2020</b></li>
                            <li>Formato: <b>CSV</b></li>
                        </ul>
                        <li>Es posible que tengas que esperar hasta que se genere el informe. A la derecha de pantalla informes puedes observar el progreso.</li>
                        <li>Si tu cuenta ha sido migrada recientemente, puede que no puedas ver la opción <b>Anual</b>. Para ello, haz click en tu identificador de cuenta junto al titulo <b>Informes</b> de la página para cambiar a tu antigua cuenta.</li>
                        <img src={InformesImage} style={{ width: "100%" }} />
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={props.onHide}>Cerrar</Button>
                </Modal.Footer>
            </Modal>
        );
    }

    render() {
        return (
            <div className=""
                onDragOver={this.dragOver}
                onDragEnter={this.dragEnter}
                onDragLeave={this.dragLeave}
                onDrop={this.fileDrop}>

                <Form>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>DNI</Form.Label>
                        <Form.Control placeholder="12345678Z" value={this.state.dni}
                            onChange={e => this.setState({ dni: e.target.value })} />
                    </Form.Group>

                    <Form.Group controlId="broker">
                        <Form.Label>País del broker</Form.Label>
                        <Form.Control value={this.state.broker_country}
                            onChange={e => this.setState({ broker_country: e.target.value })} as="select" >
                            <option value=''></option>
                            {countries.map((c) => {
                                return <option value={c['code']}>{c['text'].slice(0, 120)}{(c['text'].length > 120) ? '...' : ''}</option>
                            })}
                        </Form.Control>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>
                            Informe anual Interacive Brokers
                            <a href="#"><Badge variant="info" onClick={() => this.setState({ modalShow: true })}>+Info</Badge ></a>
                            <this.MyVerticallyCenteredModal
                                show={this.state.modalShow}
                                onHide={() => this.setState({ modalShow: false })}
                            />

                        </Form.Label>
                        <Form.File onChange={this.onFileChange}
                            id="custom-file"
                            label={this.state.filename}
                            custom
                        />
                    </Form.Group>
                    {this.displayForex()}
                    {this.displayElements()}

                </Form>

                {this.state.text.length > 0 ?
                    (<Alert variant={this.state.status} className="mt-3">{this.state.text}</Alert>) : null
                }


                {this.data ?
                    <Button onClick={() => this.downloadTxtFile(this.state.dni, new Modelo720(this.state.dni, this.state.broker_country, this.data!)!.build())}>Descargar</Button>
                    : null
                }
            </div>
        )
    }
}
